import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CalendarGrid, type CalendarEvent } from '@/components/calendar/CalendarGrid'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Calendar' }

export default async function InstructorCalendarPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    select: { id: true, name: true },
  })

  const courseIds = courses.map(c => c.id)
  const courseNameMap = Object.fromEntries(courses.map(c => [c.id, c.name]))
  const multiCourse = courses.length > 1

  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    select: { id: true, title: true, type: true, dueDate: true, isPublished: true, courseId: true },
    orderBy: { dueDate: 'asc' },
  })

  const events: CalendarEvent[] = assignments.map(a => ({
    id: a.id,
    title: a.title,
    type: a.type,
    dueDate: a.dueDate.toISOString(),
    href: `/instructor/assignments/${a.id}`,
    isPublished: a.isPublished,
    courseName: multiCourse ? courseNameMap[a.courseId] : undefined,
  }))

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Calendar">
      <div className="max-w-5xl space-y-2">
        {courses.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No courses yet — create a course to see assignments here.</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Drafts are shown faded with a dashed border. Click any assignment to edit it.
            </p>
            <CalendarGrid events={events} />
          </>
        )}
      </div>
    </DashboardShell>
  )
}
