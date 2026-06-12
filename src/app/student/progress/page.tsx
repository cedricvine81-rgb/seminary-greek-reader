import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ProgressSummary } from '@/components/student/ProgressSummary'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Accuracy' }

export default async function StudentProgressPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub, status: 'APPROVED' },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const [assignments, responses, exegesisSessions] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, type: true, title: true, questions: { select: { id: true } } },
    }),
    prisma.response.findMany({
      where: { userId: payload.sub },
      select: { assignmentId: true, questionId: true, isCorrect: true, score: true, submittedAt: true },
    }),
    // Passage exercises: submitted ExegesisSession rows (with optional instructor grade)
    prisma.exegesisSession.findMany({
      where: { userId: payload.sub, submittedAt: { not: null } },
      select: { assignmentId: true, grade: true, submittedAt: true },
    }),
  ])

  const assignmentMap = Object.fromEntries(assignments.map(a => [a.id, a]))
  const passageExerciseIds = new Set(
    assignments.filter(a => a.type === 'TRANSLATION_EXERCISE' && a.questions.length === 0).map(a => a.id)
  )

  // Completed via Response sentinel (quizzes + question-based translation)
  const completedViaResponse = new Set(
    responses.filter(r => !r.questionId).map(r => r.assignmentId)
  )
  // Completed via ExegesisSession submission (passage exercises)
  const completedViaSession = new Set(
    exegesisSessions
      .filter(s => s.assignmentId && passageExerciseIds.has(s.assignmentId))
      .map(s => s.assignmentId as string)
  )
  const completedIds = new Set([...Array.from(completedViaResponse), ...Array.from(completedViaSession)])

  const byType: Record<string, { correct: number; total: number }> = {}
  for (const r of responses.filter(r => r.questionId)) {
    const assignment = assignmentMap[r.assignmentId]
    const type = assignment?.type ?? 'UNKNOWN'
    if (!byType[type]) byType[type] = { correct: 0, total: 0 }
    byType[type].total++
    if (r.isCorrect) byType[type].correct++
  }

  const accuracyByType = Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, v.total > 0 ? (v.correct / v.total) * 100 : 0])
  ) as Record<string, number>

  // Average score: include graded ExegesisSession grades alongside Response-based scores
  const quizScores = responses
    .filter(r => !r.questionId && r.score !== null)
    .map(r => r.score as number)
  const exegesisScores = exegesisSessions
    .filter(s => s.grade !== null && s.assignmentId && passageExerciseIds.has(s.assignmentId))
    .map(s => s.grade as number)
  const allScores = [...quizScores, ...exegesisScores]
  const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

  // Recent activity: combine quiz completions and exegesis submissions
  type ActivityItem = { assignmentId: string; assignmentTitle: string; completedAt: string; score: number; percentage: number }
  const recentFromQuizzes: ActivityItem[] = responses
    .filter(r => !r.questionId && r.score !== null)
    .map(r => ({
      assignmentId: r.assignmentId,
      assignmentTitle: assignmentMap[r.assignmentId]?.title ?? 'Unknown',
      completedAt: r.submittedAt.toISOString(),
      score: r.score as number,
      percentage: r.score as number,
    }))
  const recentFromExegesis: ActivityItem[] = exegesisSessions
    .filter(s => s.submittedAt && s.assignmentId && passageExerciseIds.has(s.assignmentId))
    .map(s => ({
      assignmentId: s.assignmentId as string,
      assignmentTitle: assignmentMap[s.assignmentId as string]?.title ?? 'Translation Exercise',
      completedAt: (s.submittedAt as Date).toISOString(),
      score: s.grade ?? 0,
      percentage: s.grade ?? 0,
    }))
  const recent = [...recentFromQuizzes, ...recentFromExegesis]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)

  return (
    <DashboardShell role="STUDENT" pageTitle="Accuracy">
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
