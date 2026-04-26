import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProgressSummary } from '@/components/student/ProgressSummary'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Progress' }

export default async function StudentProgressPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const [assignments, responses] = await Promise.all([
    prisma.assignment.findMany({ where: { courseId: { in: courseIds } }, select: { id: true, type: true } }),
    prisma.response.findMany({
      where: { userId: payload.sub },
      include: { assignment: { select: { title: true } } },
    }),
  ])

  const completedIds = new Set(responses.filter(r => !r.questionId).map(r => r.assignmentId))

  const byType: Record<string, { correct: number; total: number }> = {}
  for (const r of responses.filter(r => r.questionId)) {
    const assignment = assignments.find(a => a.id === r.assignmentId)
    const type = assignment?.type ?? 'UNKNOWN'
    if (!byType[type]) byType[type] = { correct: 0, total: 0 }
    byType[type].total++
    if (r.isCorrect) byType[type].correct++
  }

  const accuracyByType = Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, v.total > 0 ? (v.correct / v.total) * 100 : 0])
  ) as Record<string, number>

  const allScores = responses.filter(r => !r.questionId && r.score !== null).map(r => r.score as number)
  const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

  const recent = responses
    .filter(r => !r.questionId && r.score !== null)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)
    .map(r => ({
      assignmentId: r.assignmentId,
      assignmentTitle: r.assignment.title,
      completedAt: r.submittedAt.toISOString(),
      score: r.score as number,
      percentage: r.score as number,
    }))

  return (
    <DashboardShell role="STUDENT" pageTitle="My Progress">
      <ProgressSummary
        stats={{
          totalAssignments: assignments.length,
          completedAssignments: completedIds.size,
          averageScore: avgScore,
          accuracyByType: accuracyByType as never,
          recentActivity: recent,
        }}
      />
    </DashboardShell>
  )
}
