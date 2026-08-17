import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AssignmentList } from '@/components/student/AssignmentList'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { completedAssignmentIds } from '@/lib/assignment-completion'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Assignments' }

export default async function StudentAssignmentsPage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub, status: 'APPROVED' },
    select: { course: { select: { id: true, name: true, endDate: true, isArchived: true } } },
  })
  const courseIds = enrollments.map(e => e.course.id)
  const courseNames = Object.fromEntries(enrollments.map(e => [e.course.id, e.course.name]))
  // "Live" courses (not archived, not yet ended) surface at the top; "earlier" courses
  // (ended or archived) sink to the bottom.
  const now = new Date()
  const liveCourseIds = new Set(
    enrollments.filter(e => !e.course.isArchived && e.course.endDate >= now).map(e => e.course.id),
  )

  const [assignments, completedIds] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
    }),
    // Every kind of submission, not just quiz Responses — otherwise handed-in translation
    // exercises, course notes, group sections and construct searches show as outstanding here
    // while the same assignment reads Completed on the student's course card.
    completedAssignmentIds(payload.sub),
  ])
  // AssignmentList is a client component; a Set can't cross the RSC boundary.
  const completedList = Array.from(completedIds)
  const serialized = assignments.map(a => ({
    ...a,
    dueDate: a.dueDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    round1Deadline: a.round1Deadline ? a.round1Deadline.toISOString() : null,
    round2Deadline: a.round2Deadline ? a.round2Deadline.toISOString() : null,
    reference: a.reference ?? undefined,
    instructions: a.instructions ?? undefined,
  }))

  // Keep each course's existing week/due-date order, but split live-course assignments
  // (shown first) from earlier-course ones (shown last).
  const live = serialized.filter(a => liveCourseIds.has(a.courseId))
  const earlier = serialized.filter(a => !liveCourseIds.has(a.courseId))
  const bothGroups = live.length > 0 && earlier.length > 0

  return (
    <DashboardShell role="STUDENT" pageTitle="Assignments">
      {serialized.length === 0 ? (
        <AssignmentList assignments={serialized} completedIds={completedList} courseNames={courseNames} />
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <div className="space-y-2">
              {bothGroups && <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('assign.currentCourses')}</h2>}
              <AssignmentList assignments={live} completedIds={completedList} courseNames={courseNames} />
            </div>
          )}
          {earlier.length > 0 && (
            <div className="space-y-2">
              {bothGroups && <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('assign.earlierCourses')}</h2>}
              <AssignmentList assignments={earlier} completedIds={completedList} courseNames={courseNames} />
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
