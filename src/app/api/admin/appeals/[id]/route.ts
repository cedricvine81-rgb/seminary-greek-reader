import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/appeals/[id]
 * Body: { decision: 'ACCEPTED' | 'REJECTED', note?: string }
 *
 * Admin reviews an instructor-accepted appeal:
 *   - ACCEPTED: adds the student's answer to LexicalEntry.acceptedAnswers for the
 *     matching lemma (dedup'd). Future grading auto-accepts it.
 *   - REJECTED: leaves the lexicon untouched. The student's grade still stands
 *     (instructor already updated it). Admin's role is global-lexicon only.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getPayload()
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { decision, note } = await req.json()
    if (decision !== 'ACCEPTED' && decision !== 'REJECTED') {
      return NextResponse.json({ error: 'decision must be ACCEPTED or REJECTED' }, { status: 400 })
    }

    const appeal = await prisma.vocabAppeal.findUnique({
      where: { id: params.id },
      include: {
        question: { select: { prompt: true } },
        student: { select: { email: true } },
      },
    })
    if (!appeal) return NextResponse.json({ error: 'Appeal not found.' }, { status: 404 })

    // Sanity: only instructor-accepted appeals reach the admin
    if (appeal.instructorDecision !== 'ACCEPTED') {
      return NextResponse.json({ error: 'This appeal is not awaiting admin review.' }, { status: 400 })
    }
    if (appeal.adminDecision !== 'PENDING') {
      return NextResponse.json({ error: 'This appeal has already been decided by an admin.' }, { status: 409 })
    }

    const now = new Date()

    if (decision === 'REJECTED') {
      await prisma.vocabAppeal.update({
        where: { id: appeal.id },
        data: {
          adminDecision: 'REJECTED',
          adminDecidedAt: now,
          adminNote: typeof note === 'string' ? note : null,
        },
      })
      await recordAudit({
        actorId: admin.sub, actorEmail: admin.email,
        action: 'appeal.adminReject',
        targetType: 'VocabAppeal', targetId: appeal.id,
        before: { adminDecision: 'PENDING' },
        after: { adminDecision: 'REJECTED', note: note ?? null },
        context: { lemma: appeal.question.prompt, answer: appeal.studentAnswer },
      })
      revalidatePath('/admin/appeals')
      return NextResponse.json({ ok: true, lexiconUpdated: false })
    }

    // ── ACCEPT: add the answer to the lemma's acceptedAnswers (dedup'd) ──
    const lemma = appeal.question.prompt
    const newAnswer = appeal.studentAnswer.trim().toLowerCase()

    // Diacritic-tolerant lemma lookup (mirrors src/lib/grading.ts:getLemmaSynonyms)
    let lex = await prisma.lexicalEntry.findFirst({
      where: { lexeme: lemma },
      select: { id: true, lexeme: true, acceptedAnswers: true },
    })
    if (!lex) {
      const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
      const stripped = strip(lemma)
      const candidates = await prisma.lexicalEntry.findMany({
        where: { lexeme: { startsWith: stripped.slice(0, 1) } },
        select: { id: true, lexeme: true, acceptedAnswers: true },
      })
      lex = candidates.find(c => strip(c.lexeme) === stripped) ?? null
    }

    let lexiconUpdated = false
    let lexiconWarning: string | null = null
    if (!lex) {
      // We accept the admin decision but can't update the lexicon — flag it
      lexiconWarning = `No lexicon entry found for "${lemma}". The appeal is marked accepted but the global lexicon was not updated.`
    } else {
      const existing = (lex.acceptedAnswers ?? '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
      if (!existing.includes(newAnswer)) {
        const next = [...existing, newAnswer].join(', ')
        await prisma.lexicalEntry.update({
          where: { id: lex.id },
          data: { acceptedAnswers: next },
        })
        lexiconUpdated = true

        await recordAudit({
          actorId: admin.sub, actorEmail: admin.email,
          action: 'lexicon.synonymsUpdate',
          targetType: 'LexicalEntry', targetId: lex.id,
          before: { lexeme: lex.lexeme, acceptedAnswers: lex.acceptedAnswers },
          after: { acceptedAnswers: next, addedVia: 'appeal', appealId: appeal.id },
        })
      }
    }

    await prisma.vocabAppeal.update({
      where: { id: appeal.id },
      data: {
        adminDecision: 'ACCEPTED',
        adminDecidedAt: now,
        adminNote: typeof note === 'string' ? note : null,
      },
    })

    await recordAudit({
      actorId: admin.sub, actorEmail: admin.email,
      action: 'appeal.adminAccept',
      targetType: 'VocabAppeal', targetId: appeal.id,
      before: { adminDecision: 'PENDING' },
      after: { adminDecision: 'ACCEPTED', note: note ?? null, lexiconUpdated },
      context: { lemma, answer: newAnswer, lexiconWarning },
    })

    revalidatePath('/admin/appeals')
    revalidatePath('/admin/vocab/synonyms')

    return NextResponse.json({ ok: true, lexiconUpdated, lexiconWarning })
  } catch (err) {
    logError('api/admin/appeals/[id]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
