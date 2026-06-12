import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Conversations } from '@/components/messaging/Conversations'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Messages' }

export default async function StudentMessagesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  // Courses the student can start a conversation about (their approved enrollments)
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub, status: 'APPROVED' },
    select: { course: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const courses = enrollments.map(e => ({ id: e.course.id, name: e.course.name }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Messages" pageDescription="Messages with your instructors. Start a new conversation or reply to an existing one.">
      <Conversations meId={payload.sub} composeCourses={courses} />
    </DashboardShell>
  )
}
