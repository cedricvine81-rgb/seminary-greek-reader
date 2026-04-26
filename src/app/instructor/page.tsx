import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { InstructorDashboard } from '@/components/instructor/InstructorDashboard'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

export default async function InstructorPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const [user, courses, assignments] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } }),
    prisma.course.findMany({
      where: { instructorId: payload.sub },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.assignment.findMany({
      where: { createdById: payload.sub },
      select: { id: true },
    }),
  ])

  const totalStudents = await prisma.enrollment.count({
    where: { courseId: { in: courses.map(c => c.id) } },
  })

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Dashboard">
      <InstructorDashboard
        instructorName={user ? `${user.firstName} ${user.surname}` : 'Instructor'}
        stats={{
          totalCourses: courses.length,
          totalStudents,
          totalAssignments: assignments.length,
          pendingGrades: 0,
        }}
        recentCourses={courses.map(c => ({
          id: c.id,
          name: c.name,
          level: c.level,
          enrollmentCount: c._count.enrollments,
        }))}
      />
    </DashboardShell>
  )
}
