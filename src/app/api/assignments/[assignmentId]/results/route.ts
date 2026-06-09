import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { courseId: true, type: true, questions: { select: { id: true, points: true, prompt: true } } },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isTranslation = assignment.type === 'TRANSLATION_EXERCISE'

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: assignment.courseId, status: 'APPROVED' },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  if (isTranslation) {
    // For Translation Exercises, look up ExegesisSession records linked to this assignment
    const sessions = await prisma.exegesisSession.findMany({
      where: {
        assignmentId: params.assignmentId,
        userId: { in: enrollments.map(e => e.user.id) },
      },
      select: {
        id: true,
        userId: true,
        submittedAt: true,
        grade: true,
        gradeNote: true,
      },
    })

    const sessionByUser = new Map(sessions.map(s => [s.userId, s]))

    const rows = enrollments.map(e => {
      const uid = e.user.id
      const session = sessionByUser.get(uid)
      const submitted = !!(session?.submittedAt)
      return {
        userId: uid,
        name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
        email: e.user.email,
        attempted: submitted,
        sessionId: session?.id ?? null,
        submittedAt: session?.submittedAt ?? null,
        grade: session?.grade ?? null,
        gradeNote: session?.gradeNote ?? null,
        // quiz fields not applicable
        earned: null,
        totalPoints: null,
        pct: session?.grade ?? null,
      }
    })

    const attempted = rows.filter(r => r.attempted)
    const gradedRows = attempted.filter(r => r.grade !== null)
    const runningPct = gradedRows.length > 0
      ? Math.round(gradedRows.reduce((s, r) => s + (r.grade ?? 0), 0) / gradedRows.length)
      : null

    return NextResponse.json({ rows, totalPoints: null, runningPct, overallPct: null, isTranslation: true })
  }

  // ── Standard quiz ─────────────────────────────────────────────────────────
  const totalPoints = assignment.questions.reduce((s, q) => s + q.points, 0)

  const responses = await prisma.response.findMany({
    where: {
      assignmentId: params.assignmentId,
      userId: { in: enrollments.map(e => e.user.id) },
      questionId: { not: null },
    },
    select: { userId: true, questionId: true, answer: true, isCorrect: true, score: true },
  })

  const rows = enrollments.map(e => {
    const uid = e.user.id
    const userResponses = responses.filter(r => r.userId === uid)
    const attempted = userResponses.length > 0
    const earned = userResponses.reduce((s, r) => s + (r.score ?? 0), 0)
    const pct = attempted && totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : null

    return {
      userId: uid,
      name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
      email: e.user.email,
      attempted,
      earned,
      totalPoints,
      pct,
      sessionId: null,
      submittedAt: null,
      grade: null,
      gradeNote: null,
    }
  })

  const attempted = rows.filter(r => r.attempted)
  const runningPct = attempted.length > 0
    ? Math.round(attempted.reduce((s, r) => s + (r.pct ?? 0), 0) / attempted.length)
    : null
  const overallPct = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + (r.pct ?? 0), 0) / rows.length)
    : null

  return NextResponse.json({ rows, totalPoints, runningPct, overallPct, isTranslation: false })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
