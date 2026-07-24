import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateVocabQuestionsForLesson } from '@/lib/quiz-generation'
import { VOCAB_LESSONS, lessonSubsectionKey } from '@/lib/vocab-lesson-map'

/**
 * Bulk edits across a whole assignment series, so a 28-quiz schedule doesn't have to be
 * corrected one row at a time.
 *
 * PATCH  { assignmentIds, action, value }   shift dates | publish | settings
 * DELETE { assignmentIds }                  remove occurrences
 *
 * Every id is checked to belong to a course this instructor owns or co-teaches, and
 * anything a student has already worked on is refused rather than silently rewritten.
 */

async function authorise(assignmentIds: string[], userId: string) {
  if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
    return { error: 'No assignments given.' as const }
  }
  const assignments = await prisma.assignment.findMany({
    where: {
      id: { in: assignmentIds },
      course: {
        OR: [{ instructorId: userId }, { coInstructors: { some: { userId } } }],
      },
    },
    select: { id: true, dueDate: true, title: true },
  })
  if (assignments.length !== assignmentIds.length) {
    return { error: 'Some assignments are not yours to edit.' as const }
  }
  return { assignments }
}

export async function PATCH(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assignmentIds, action, value } = await req.json()
  const auth = await authorise(assignmentIds, payload.sub)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 400 })

  let updated = 0

  if (action === 'shiftDays') {
    const days = Number(value)
    if (!Number.isFinite(days) || days === 0) {
      return NextResponse.json({ error: 'Give a non-zero number of days.' }, { status: 400 })
    }
    // Each due date moves individually so the spacing of the series is preserved.
    for (const a of auth.assignments) {
      await prisma.assignment.update({
        where: { id: a.id },
        data: { dueDate: new Date(a.dueDate.getTime() + days * 24 * 60 * 60 * 1000) },
      })
      updated++
    }
    return NextResponse.json({ updated })
  }

  // Cumulative review: rebuild each vocabulary quiz so the given share of its questions
  // comes from earlier lessons. This regenerates questions (the review mix is baked into
  // them), so it is refused once students have answered any of them.
  if (action === 'reviewPct') {
    const pct = Math.min(Math.max(Number(value), 0), 100)
    const rows = await prisma.assignment.findMany({
      where: { id: { in: assignmentIds }, type: 'VOCABULARY_QUIZ' },
      include: { _count: { select: { questions: true, responses: true } } },
    })
    const answered = rows.filter(r => r._count.responses > 0)
    if (answered.length > 0) {
      return NextResponse.json({
        error: `${answered.length} of these have student answers, so their questions can’t be rebuilt.`,
      }, { status: 409 })
    }
    for (const r of rows) {
      // The builder writes the section into the title ("… (§2-E)"); fall back to the week.
      const m = r.title.match(/§(\d)-([A-H])/)
      const lesson = m
        ? VOCAB_LESSONS.find(l => lessonSubsectionKey(l.lesson) === `${m[1]}-${m[2]}`)?.lesson
        : r.weekNumber
      if (!lesson) continue
      const count = r._count.questions || 20
      const qs = generateVocabQuestionsForLesson(
        lesson, 'GREEK_TO_ENGLISH', count, r.provideDefinition ? 100 : 0, pct)
      await prisma.$transaction([
        prisma.question.deleteMany({ where: { assignmentId: r.id } }),
        prisma.question.createMany({ data: qs.map(q => ({ ...q, assignmentId: r.id })) }),
        prisma.assignment.update({ where: { id: r.id }, data: { vocabReviewPct: pct } }),
      ])
      updated++
    }
    return NextResponse.json({ updated })
  }

  const data: Record<string, unknown> = {}
  switch (action) {
    case 'publish':          data.isPublished = Boolean(value); break
    case 'maxRetakes':       data.maxRetakes = value === null ? null : Math.max(0, Number(value)); break
    case 'maxAppeals':       data.maxAppeals = value === null ? null : Math.max(0, Number(value)); break
    case 'timePerQuestion':  data.timePerQuestion = value ? Math.max(0, Number(value)) : null; break
    case 'allowLate':        data.allowLate = Boolean(value); break
    case 'lateDaysLimit':    data.lateDaysLimit = value === null ? null : Math.max(0, Number(value)); break
    default:
      return NextResponse.json({ error: `Unknown action "${action}".` }, { status: 400 })
  }

  const res = await prisma.assignment.updateMany({
    where: { id: { in: assignmentIds } },
    data,
  })
  return NextResponse.json({ updated: res.count })
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assignmentIds } = await req.json()
  const auth = await authorise(assignmentIds, payload.sub)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 400 })

  // Refuse anything a student has already sat — deleting it would take their work with it.
  const [attempts, responses] = await Promise.all([
    prisma.quizAttempt.groupBy({
      by: ['assignmentId'],
      where: { assignmentId: { in: assignmentIds } },
      _count: { _all: true },
    }),
    prisma.response.groupBy({
      by: ['assignmentId'],
      where: { assignmentId: { in: assignmentIds } },
      _count: { _all: true },
    }),
  ])
  const withWork = new Set([
    ...attempts.map(a => a.assignmentId),
    ...responses.map(r => r.assignmentId),
  ])
  if (withWork.size > 0) {
    const titles = auth.assignments.filter(a => withWork.has(a.id)).map(a => a.title)
    return NextResponse.json({
      error: `${withWork.size} of these have student work and were not deleted: ${titles.slice(0, 4).join(', ')}${titles.length > 4 ? '…' : ''}`,
    }, { status: 409 })
  }

  const res = await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } })
  return NextResponse.json({ deleted: res.count })
}
