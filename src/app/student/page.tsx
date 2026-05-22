import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { Assignment } from '@/types/assignment'

export const metadata: Metadata = { title: 'Student Dashboard' }

export default async function StudentPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const [user, enrollments, completedResponses, allResponses] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } }),
    prisma.enrollment.findMany({ where: { userId: payload.sub }, include: { course: { include: { assignments: true } } } }),
    // distinct assignmentIds for completion detection
    prisma.response.findMany({
      where: { userId: payload.sub, questionId: { not: null } },
      select: { assignmentId: true },
      distinct: ['assignmentId'],
    }),
    // all responses for score computation
    prisma.response.findMany({
      where: { userId: payload.sub, questionId: { not: null } },
      select: { assignmentId: true, score: true },
    }),
  ])

  const allAssignments = enrollments.flatMap(e => e.course.assignments)
  const completedIds = new Set(completedResponses.map(r => r.assignmentId))
  const pending = allAssignments.filter(a => !completedIds.has(a.id) && new Date(a.dueDate) >= new Date())

  // Compute running average % — earned / possible across completed assignments
  let avgScore: number | null = null
  if (completedIds.size > 0) {
    const completedAssignmentIds = Array.from(completedIds)
    const [questionTotals] = await Promise.all([
      prisma.question.groupBy({
        by: ['assignmentId'],
        where: { assignmentId: { in: completedAssignmentIds } },
        _sum: { points: true },
      }),
    ])
    const totalPossible = questionTotals.reduce((s, g) => s + (g._sum.points ?? 0), 0)
    const totalEarned = allResponses
      .filter(r => completedIds.has(r.assignmentId))
      .reduce((s, r) => s + (r.score ?? 0), 0)
    avgScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : null
  }

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

  return (
    <DashboardShell role="STUDENT" pageTitle="Dashboard">
      <StudentDashboard
        studentName={user?.firstName ?? 'Student'}
        pendingAssignments={serializedPending}
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
