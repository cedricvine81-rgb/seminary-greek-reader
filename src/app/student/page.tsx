import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import type { Assignment } from '@/types/assignment'

export const metadata: Metadata = { title: 'Student Dashboard' }

export default async function StudentPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const [user, enrollments, completedResponses, bestAttempts, recentAttempts] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } }),
    prisma.enrollment.findMany({ where: { userId: payload.sub, status: 'APPROVED' }, include: { course: { include: { assignments: true } } } }),
    prisma.response.findMany({
      where: { userId: payload.sub },
      select: { assignmentId: true },
      distinct: ['assignmentId'],
    }),
    // Best quiz attempt per quiz — used for the average grade (already scored per
    // attempt, i.e. out of the questions shown, so it's correct for re-sampling pools).
    prisma.quizAttempt.findMany({
      where: { userId: payload.sub, isBest: true },
      select: { percentage: true },
    }),
    // Recent best quiz attempts for score feed
    prisma.quizAttempt.findMany({
      where: { userId: payload.sub, isBest: true },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { assignment: { select: { title: true } } },
    }),
  ])

  const allAssignments = enrollments.flatMap(e => e.course.assignments)
  const completedIds = new Set(completedResponses.map(r => r.assignmentId))
  const pending = allAssignments.filter(a => !completedIds.has(a.id) && new Date(a.dueDate) >= new Date())

  // Average grade = mean of the best per-attempt percentages (each already scored
  // out of the questions actually shown). Avoids dividing by the whole word pool.
  const avgScore: number | null = bestAttempts.length > 0
    ? Math.round(bestAttempts.reduce((s, a) => s + a.percentage, 0) / bestAttempts.length)
    : null

  const serializedPending: Assignment[] = pending.slice(0, 5).map(a => ({
    id: a.id,
    courseId: a.courseId,
    createdById: a.createdById,
    title: a.title,
    type: a.type as Assignment['type'],
    weekNumber: a.weekNumber,
    dueDate: a.dueDate.toISOString(),
    level: a.level as Assignment['level'],
    reference: a.reference ?? undefined,
    instructions: a.instructions ?? undefined,
    timePerQuestion: a.timePerQuestion,
    allowLate: a.allowLate,
    lateDaysLimit: a.lateDaysLimit,
    isPublished: a.isPublished,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  const recentScores = recentAttempts.map(a => ({
    assignmentId: a.assignmentId,
    title: a.assignment.title,
    percentage: a.percentage,
    completedAt: a.completedAt.toISOString(),
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Dashboard">
      <StudentDashboard
        studentName={user?.firstName ?? 'Student'}
        pendingAssignments={serializedPending}
        recentScores={recentScores}
        stats={{
          enrolledCourses: enrollments.length,
          pendingAssignments: pending.length,
          completedAssignments: completedIds.size,
          averageScore: avgScore,
        }}
      />
    </DashboardShell>
  )
}
