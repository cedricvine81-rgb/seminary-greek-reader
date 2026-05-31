import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
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
    select: { courseId: true, questions: { select: { id: true, points: true, prompt: true } } },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totalPoints = assignment.questions.reduce((s, q) => s + q.points, 0)

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: assignment.courseId },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

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
    }
  })

  const attempted = rows.filter(r => r.attempted)
  const runningPct = attempted.length > 0
    ? Math.round(attempted.reduce((s, r) => s + (r.pct ?? 0), 0) / attempted.length)
    : null
  const overallPct = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + (r.pct ?? 0), 0) / rows.length)
    : null

  return NextResponse.json({ rows, totalPoints, runningPct, overallPct })
}
