import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET() {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const [assignments, responses] = await Promise.all([
    prisma.assignment.findMany({ where: { courseId: { in: courseIds } }, select: { id: true, type: true } }),
    prisma.response.findMany({
      where: { userId: payload.sub },
      select: { assignmentId: true, questionId: true, isCorrect: true, score: true, submittedAt: true },
    }),
  ])

  const completedIds = new Set(responses.filter(r => !r.questionId).map(r => r.assignmentId))
  const qResponses = responses.filter(r => r.questionId)

  const byType: Record<string, { correct: number; total: number }> = {}
  for (const r of qResponses) {
    const a = assignments.find(a => a.id === r.assignmentId)
    const type = a?.type ?? 'UNKNOWN'
    if (!byType[type]) byType[type] = { correct: 0, total: 0 }
    byType[type].total++
    if (r.isCorrect) byType[type].correct++
  }

  return NextResponse.json({
    totalAssignments: assignments.length,
    completedAssignments: completedIds.size,
    accuracyByType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, v.total > 0 ? (v.correct / v.total) * 100 : 0])
    ),
  })
}
