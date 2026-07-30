import { redirect } from 'next/navigation'
import { groupByStatus } from '@/lib/course-status'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { effectiveDeadline } from '@/lib/assignment-deadline'
import { normalizeCategoryWeights } from '@/lib/grade-weights'
import { completedAssignmentIds } from '@/lib/assignment-completion'

export const metadata: Metadata = { title: 'Student Dashboard' }

export default async function StudentPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const [user, enrollments, completedIds, exegesisSessions, bestAttempts, constructSubmissions] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.sub }, select: { firstName: true, surname: true } }),
    prisma.enrollment.findMany({
      where: { userId: payload.sub, status: 'APPROVED' },
      include: {
        course: {
          include: {
            assignments: true,
            instructor: { select: { firstName: true, surname: true, title: true, email: true } },
          },
        },
      },
    }),
    // Shared with the Assignments list, so the two never disagree about what's been handed in.
    completedAssignmentIds(payload.sub),
    // Translation exercises: the instructor's grade for the per-course grade book.
    prisma.exegesisSession.findMany({
      where: { userId: payload.sub, assignmentId: { not: null }, grade: { not: null } },
      select: { assignmentId: true, grade: true },
    }),
    // Best quiz attempt per quiz (stored per-attempt %, correct for re-sampling pools).
    prisma.quizAttempt.findMany({
      where: { userId: payload.sub, isBest: true },
      select: { assignmentId: true, percentage: true },
    }),
    // Construct searches: the instructor's grade for the per-course grade book.
    prisma.constructSubmission.findMany({
      where: { userId: payload.sub, grade: { not: null } },
      select: { assignmentId: true, grade: true },
    }),
  ])

  // Score for the per-course grade book: quiz/morph → best attempt %, translation
  // exercise → instructor grade (0–100). Uses stored values, so it's immune to
  // later question regeneration / pool size.
  const bestPctByAssignment = new Map(bestAttempts.map(a => [a.assignmentId, a.percentage]))
  const gradeByAssignment = new Map(
    exegesisSessions.filter(s => s.grade != null && s.assignmentId).map(s => [s.assignmentId as string, s.grade as number]),
  )
  const constructGradeByAssignment = new Map(
    constructSubmissions.filter(c => c.grade != null).map(c => [c.assignmentId, c.grade as number]),
  )
  function scoreFor(a: { id: string; type: string }): number | null {
    if (a.type === 'TRANSLATION_EXERCISE' || a.type === 'TRANSLATION_EXAM') return gradeByAssignment.get(a.id) ?? null
    if (a.type === 'CONSTRUCT_SEARCH') return constructGradeByAssignment.get(a.id) ?? null
    return bestPctByAssignment.get(a.id) ?? null
  }

  const allAssignments = enrollments.flatMap(e => e.course.assignments)
  const pending = allAssignments.filter(a => !completedIds.has(a.id) && effectiveDeadline(a) >= new Date())
  // Header nudge: assignments due within the next 3 days.
  const dueSoonCount = pending.filter(a => {
    const days = Math.ceil((effectiveDeadline(a).getTime() - Date.now()) / 86400000)
    return days <= 3
  }).length

  // Enrolled courses for the "My Courses" card — each with its own grade book
  // (assignments grouped by type, the student's score per assignment).
  // Current courses first, then upcoming, then finished — the dashboard only shows
  // the first five, so a live course must never be crowded out by a past one.
  const orderedEnrollments = groupByStatus(enrollments, e => ({
    startDate: e.course.startDate, endDate: e.course.endDate,
  })).flatMap(g => g.items)

  const courses = orderedEnrollments.slice(0, 5).map(e => {
    const published = e.course.assignments.filter(a => a.isPublished).slice().sort((a, b) => a.weekNumber - b.weekNumber)
    return {
      id: e.course.id,
      name: e.course.name,
      startDate: e.course.startDate.toISOString(),
      endDate: e.course.endDate.toISOString(),
      instructorName: [e.course.instructor.title, e.course.instructor.firstName, e.course.instructor.surname].filter(Boolean).join(' '),
      instructorEmail: e.course.instructor.email,
      assignments: published.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type as string,
        dueDate: effectiveDeadline(a).toISOString(),
        weekNumber: a.weekNumber,
        completed: completedIds.has(a.id),
      })),
      gradebookRows: published.map(a => ({ id: a.id, title: a.title, weekNumber: a.weekNumber, type: a.type as string, pct: scoreFor(a) })),
      gradeCategoryWeights: normalizeCategoryWeights(e.course.gradeCategoryWeights),
    }
  })

  return (
    <DashboardShell role="STUDENT" pageTitle="Dashboard">
      <StudentDashboard
        studentName={user?.firstName ?? 'Student'}
        courses={courses}
        dueSoonCount={dueSoonCount}
      />
    </DashboardShell>
  )
}
