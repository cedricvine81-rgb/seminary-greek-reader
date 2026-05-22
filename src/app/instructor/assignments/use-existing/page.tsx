import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CopyAssignmentsPanel } from '@/components/instructor/CopyAssignmentsPanel'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Use Existing Assignments' }

export default async function UseExistingPage({
  searchParams,
}: {
  searchParams: { courseId?: string }
}) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub },
    select: { id: true, name: true, level: true },
    orderBy: { createdAt: 'desc' },
  })

  const assignments = await prisma.assignment.findMany({
    where: { createdById: payload.sub },
    include: {
      course: { select: { id: true, name: true } },
      _count: { select: { questions: true } },
    },
    orderBy: [{ course: { name: 'asc' } }, { weekNumber: 'asc' }],
  })

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Use Existing Assignments">
      <CopyAssignmentsPanel
        courses={courses}
        assignments={assignments}
        defaultTargetCourseId={searchParams.courseId ?? courses[0]?.id ?? ''}
      />
    </DashboardShell>
  )
}
