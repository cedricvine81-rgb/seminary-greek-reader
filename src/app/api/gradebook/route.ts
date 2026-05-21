import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })

  // Verify the course belongs to this instructor
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  })
  if (!course || course.instructorId !== payload.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // All quiz assignments for this course, ordered by week
  const assignments = await prisma.assignment.findMany({
    where: {
      courseId,
      type: { in: ['VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ'] },
    },
    select: { id: true, title: true, weekNumber: true, questions: { select: { points: true } } },
    orderBy: { weekNumber: 'asc' },
  })

  // All enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  // All responses for these assignments and these students
  const assignmentIds = assignments.map(a => a.id)
  const studentIds = enrollments.map(e => e.user.id)

  const responses = await prisma.response.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      userId: { in: studentIds },
      questionId: { not: null },
    },
    select: { userId: true, assignmentId: true, isCorrect: true, score: true, questionId: true },
  })

  // Build per-student × per-assignment score map
  const scoreMap: Record<string, Record<string, { earned: number; total: number }>> = {}

  for (const a of assignments) {
    const totalPts = a.questions.reduce((s, q) => s + q.points, 0)
    for (const e of enrollments) {
      const uid = e.user.id
      if (!scoreMap[uid]) scoreMap[uid] = {}
      const earned = responses
        .filter(r => r.userId === uid && r.assignmentId === a.id)
        .reduce((s, r) => s + (r.score ?? 0), 0)
      const attempted = responses.some(r => r.userId === uid && r.assignmentId === a.id)
      scoreMap[uid][a.id] = attempted ? { earned, total: totalPts } : { earned: -1, total: totalPts }
    }
  }

  // Build rows
  const rows = enrollments.map(e => {
    const uid = e.user.id
    const quizScores = assignments.map(a => {
      const s = scoreMap[uid]?.[a.id]
      if (!s || s.earned < 0) return null  // not attempted
      return s.total > 0 ? Math.round((s.earned / s.total) * 100) : 0
    })

    const attempted = quizScores.filter(s => s !== null) as number[]
    const runningPct = attempted.length > 0
      ? Math.round(attempted.reduce((a, b) => a + b, 0) / attempted.length)
      : null
    const totalPct = assignments.length > 0
      ? Math.round(
          assignments.reduce((sum, a) => {
            const s = scoreMap[uid]?.[a.id]
            if (!s || s.earned < 0) return sum  // treat unattempted as 0 for overall
            return sum + (s.total > 0 ? (s.earned / s.total) * 100 : 0)
          }, 0) / assignments.length
        )
      : null

    return {
      userId: uid,
      name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
      email: e.user.email,
      quizScores,
      runningPct,
      totalPct,
    }
  })

  return NextResponse.json({
    assignments: assignments.map(a => ({ id: a.id, title: a.title, weekNumber: a.weekNumber })),
    rows,
  })
}
