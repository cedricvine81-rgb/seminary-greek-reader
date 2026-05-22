import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AssignmentList } from '@/components/student/AssignmentList'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Assignments' }

export default async function StudentAssignmentsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const [assignments, responses] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
    }),
    prisma.response.findMany({
      where: { userId: payload.sub, questionId: { not: null } },
      select: { assignmentId: true },
      distinct: ['assignmentId'],
    }),
  ])

  const completedIds = new Set(responses.map(r => r.assignmentId))
  const serialized = assignments.map(a => ({
    ...a,
    dueDate: a.dueDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    reference: a.reference ?? undefined,
    instructions: a.instructions ?? undefined,
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Assignments">
      <AssignmentList assignments={serialized} completedIds={completedIds} />
    </DashboardShell>
  )
}
