import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { normalise } from '@/lib/answer-matching'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/instructor/appeals/[id]
 * Body: { decision: 'ACCEPTED' | 'REJECTED', note?: string }
 *
 * - REJECTED: closes the appeal, no grade change.
 * - ACCEPTED:
 *    1. Flip the appealed Response to correct (isCorrect=true, score=question.points).
 *    2. SPILLOVER: any other wrong Response on the same assignment & question whose
 *       answer text normalises identically also gets flipped to correct.
 *    3. Recompute every affected user's QuizAttempt(s) for this assignment:
 *       new earnedPoints = sum of best-attempt Response scores, percentage updated,
 *       isBest re-evaluated across that user's attempts.
 *    4. Forward the appeal to the admin queue with adminDecision='PENDING'.
 *    5. Audit-log everything.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { decision, note } = await req.json()
    if (decision !== 'ACCEPTED' && decision !== 'REJECTED') {
      return NextResponse.json({ error: 'decision must be ACCEPTED or REJECTED' }, { status: 400 })
    }

    // Load the appeal + authorisation context
    const appeal = await prisma.vocabAppeal.findUnique({
      where: { id: params.id },
      include: {
        assignment: { select: { id: true, courseId: true, course: { select: { instructorId: true, coInstructors: { select: { userId: true } } } } } },
        question: { select: { id: true, points: true, prompt: true, correctAnswer: true } },
        response: { select: { id: true, userId: true, assignmentId: true, answer: true, isCorrect: true, score: true } },
        student: { select: { id: true, email: true } },
      },
    })
    if (!appeal) return NextResponse.json({ error: 'Appeal not found.' }, { status: 404 })

    // Authorise: caller must own or co-teach the course
    const c = appeal.assignment.course
    const authorised = c.instructorId === payload.sub || c.coInstructors.some(ci => ci.userId === payload.sub)
    if (!authorised) return NextResponse.json({ error: 'Not authorised for this appeal.' }, { status: 403 })

    // Idempotency: can't decide twice
    if (appeal.instructorDecision !== 'PENDING') {
      return NextResponse.json({ error: 'This appeal has already been decided.' }, { status: 409 })
    }

    const now = new Date()

    // ── REJECT branch ─────────────────────────────────────────────────────────
    if (decision === 'REJECTED') {
      await prisma.vocabAppeal.update({
        where: { id: appeal.id },
        data: {
          instructorDecision: 'REJECTED',
          instructorDecidedAt: now,
          instructorNote: typeof note === 'string' ? note : null,
          // Admin will never see a rejected appeal — mark NOT_APPLICABLE
          adminDecision: 'NOT_APPLICABLE',
        },
      })

      await recordAudit({
        actorId: payload.sub,
        actorEmail: payload.email,
        action: 'appeal.reject',
        targetType: 'VocabAppeal',
        targetId: appeal.id,
        before: { instructorDecision: 'PENDING' },
        after: { instructorDecision: 'REJECTED', note: note ?? null },
        context: { studentEmail: appeal.student.email, lemma: appeal.question.prompt },
      })

      revalidatePath('/instructor/appeals')
      revalidatePath('/student/assignments')
      return NextResponse.json({ ok: true })
    }

    // ── ACCEPT branch (with spillover + grade recompute) ──────────────────────
    const points = appeal.question.points ?? 1
    const targetAnswerNormalised = normalise(appeal.studentAnswer)
    const assignmentId = appeal.assignment.id

    // Find every Response on this assignment for this question that is currently
    // wrong and whose answer normalises to the same text. That includes the
    // appealing student's response AND every other student who gave the same
    // answer (spillover).
    const candidates = await prisma.response.findMany({
      where: {
        assignmentId,
        questionId: appeal.question.id,
        isCorrect: false,
      },
      select: { id: true, userId: true, answer: true, score: true },
    })
    const matching = candidates.filter(r => normalise(r.answer) === targetAnswerNormalised)

    // Set of affected users — used to recompute their QuizAttempt records
    const affectedUserIds = Array.from(new Set(matching.map(r => r.userId)))

    await prisma.$transaction(async tx => {
      // 1. Flip the matching responses to correct
      const updatedIds = matching.map(r => r.id)
      if (updatedIds.length > 0) {
        await tx.response.updateMany({
          where: { id: { in: updatedIds } },
          data: { isCorrect: true, score: points },
        })
      }

      // 2. Recompute QuizAttempt aggregates for each affected user.
      // The Response rows above represent each user's *best-attempt* responses
      // (since older responses were deleted by previous best-attempt updates).
      // So we recompute the best attempt's earnedPoints/percentage from the
      // current Response set, leaving non-best attempts alone.
      for (const uid of affectedUserIds) {
        const userResponses = await tx.response.findMany({
          where: { userId: uid, assignmentId, questionId: { not: null } },
          select: { score: true },
        })
        const earned = userResponses.reduce((s, r) => s + (r.score ?? 0), 0)

        // Find the user's current best attempt — that's the one whose Responses match.
        // Update its earnedPoints + percentage. Other attempts stay as recorded snapshots.
        const best = await tx.quizAttempt.findFirst({
          where: { userId: uid, assignmentId, isBest: true },
          select: { id: true, totalPoints: true },
        })
        if (best) {
          const pct = best.totalPoints > 0 ? Math.round((earned / best.totalPoints) * 100) : 0
          await tx.quizAttempt.update({
            where: { id: best.id },
            data: { earnedPoints: earned, percentage: pct },
          })
        }
      }

      // 3. Update the appeal itself + forward to admin
      await tx.vocabAppeal.update({
        where: { id: appeal.id },
        data: {
          instructorDecision: 'ACCEPTED',
          instructorDecidedAt: now,
          instructorNote: typeof note === 'string' ? note : null,
          adminDecision: 'PENDING', // forward to admin queue
        },
      })
    }, { timeout: 60_000 })

    // Audit (outside transaction — best-effort)
    await recordAudit({
      actorId: payload.sub,
      actorEmail: payload.email,
      action: 'appeal.accept',
      targetType: 'VocabAppeal',
      targetId: appeal.id,
      before: {
        instructorDecision: 'PENDING',
        appealedResponseId: appeal.response.id,
      },
      after: {
        instructorDecision: 'ACCEPTED',
        note: note ?? null,
        responsesFlipped: matching.length,
        affectedUsers: affectedUserIds.length,
        adminQueueAdded: true,
      },
      context: {
        studentEmail: appeal.student.email,
        lemma: appeal.question.prompt,
        acceptedAnswer: appeal.studentAnswer,
      },
    })

    revalidatePath('/instructor/appeals')
    revalidatePath('/admin/appeals')
    revalidatePath('/student/assignments')
    revalidatePath(`/instructor/courses/${appeal.assignment.courseId}`)

    return NextResponse.json({
      ok: true,
      responsesFlipped: matching.length,
      affectedUsers: affectedUserIds.length,
    })
  } catch (err) {
    logError('api/instructor/appeals/[id]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
