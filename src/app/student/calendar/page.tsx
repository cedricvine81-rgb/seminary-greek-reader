import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CalendarGrid, type CalendarEvent } from '@/components/calendar/CalendarGrid'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Calendar' }

export default async function StudentCalendarPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  // All approved enrollments → published assignments
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub, status: 'APPROVED' },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)

  const [assignments, attempts] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      select: { id: true, title: true, type: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
    }),
    // Best attempts — to mark completed quizzes
    prisma.quizAttempt.findMany({
      where: { userId: payload.sub, isBest: true },
      select: { assignmentId: true },
    }),
  ])

  const completedIds = new Set(attempts.map(a => a.assignmentId))

  const events: CalendarEvent[] = assignments.map(a => ({
    id: a.id,
    title: a.title,
    type: a.type,
    dueDate: a.dueDate.toISOString(),
    href: `/student/assignments/${a.id}`,
    isCompleted: completedIds.has(a.id),
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Calendar">
      <div className="max-w-5xl">
        {events.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No assignments yet. Enroll in a course to see your schedule here.
          </p>
        ) : (
          <CalendarGrid events={events} />
        )}
      </div>
    </DashboardShell>
  )
}
