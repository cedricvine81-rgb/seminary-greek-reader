import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { EnrollmentRequests } from '@/components/instructor/EnrollmentRequests'
import { Card } from '@/components/ui/Card'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Enrollment Requests' }

export default async function RequestsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: {
      isArchived: false,
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    select: { id: true },
  })

  const courseIds = courses.map(c => c.id)

  const pendingEnrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds }, status: 'PENDING', user: { deletedAt: null } },
    select: {
      id: true,
      createdAt: true,
      user: { select: { firstName: true, surname: true, email: true } },
      course: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const pending = pendingEnrollments.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Enrollment Requests">
      {pending.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-400 italic text-center py-6">No pending enrollment requests.</p>
        </Card>
      ) : (
        <EnrollmentRequests pending={pending} />
      )}
    </DashboardShell>
  )
}
