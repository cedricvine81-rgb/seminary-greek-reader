import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Student Dashboard' }

export default async function StudentPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const [user, enrollments, responses] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } }),
    prisma.enrollment.findMany({ where: { userId: payload.sub }, include: { course: { include: { assignments: true } } } }),
    prisma.response.findMany({ where: { userId: payload.sub, questionId: null }, select: { assignmentId: true, score: true } }),
  ])

  const allAssignments = enrollments.flatMap(e => e.course.assignments)
  const completedIds = new Set(responses.map(r => r.assignmentId))
  const pending = allAssignments.filter(a => !completedIds.has(a.id) && new Date(a.dueDate) >= new Date())

  const scores = responses.map(r => r.score).filter((s): s is number => s !== null)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  return (
    <DashboardShell role="STUDENT" pageTitle="Dashboard">
      <StudentDashboard
        studentName={user ? user.firstName : 'Student'}
        pendingAssignments={pending.slice(0, 5).map(a => ({
          ...a,
          dueDate: a.dueDate.toISOString(),
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          reference: a.reference ?? undefined,
          instructions: a.instructions ?? undefined,
        }))}
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
