import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AssignmentBuilder } from '@/components/instructor/AssignmentBuilder'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Select } from '@/components/ui/Select'

export const metadata: Metadata = { title: 'New Assignment' }

export default async function NewAssignmentPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub },
    select: { id: true, name: true, level: true },
    orderBy: { createdAt: 'desc' },
  })

  if (courses.length === 0) {
    return (
      <DashboardShell role="INSTRUCTOR" pageTitle="New Assignment">
        <p className="text-sm text-gray-500">Create a course first before adding assignments.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="New Assignment">
      <AssignmentBuilder
        courseId={courses[0].id}
        courseLevel={courses[0].level}
      />
    </DashboardShell>
  )
}
