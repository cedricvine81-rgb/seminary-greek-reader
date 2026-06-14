import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import type { Assignment } from '@/types/assignment'

export const metadata: Metadata = { title: 'Student Dashboard' }

export default async function StudentPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const [user, enrollments, completedResponses, recentAttempts, exegesisSessions, bestAttempts] = await Promise.all([
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
    prisma.response.findMany({
      where: { userId: payload.sub },
      select: { assignmentId: true },
      distinct: ['assignmentId'],
    }),
    // Recent best quiz attempts for score feed
    prisma.quizAttempt.findMany({
      where: { userId: payload.sub, isBest: true },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { assignment: { select: { title: true } } },
    }),
    // Translation exercises: submittedAt → completed; grade → per-course gradebook.
    prisma.exegesisSession.findMany({
      where: { userId: payload.sub, assignmentId: { not: null } },
      select: { assignmentId: true, submittedAt: true, grade: true },
    }),
    // Best quiz attempt per quiz (stored per-attempt %, correct for re-sampling pools).
    prisma.quizAttempt.findMany({
      where: { userId: payload.sub, isBest: true },
      select: { assignmentId: true, percentage: true },
    }),
  ])

  // Score for the per-course grade book: quiz/morph → best attempt %, translation
  // exercise → instructor grade (0–100). Uses stored values, so it's immune to
  // later question regeneration / pool size.
  const bestPctByAssignment = new Map(bestAttempts.map(a => [a.assignmentId, a.percentage]))
  const gradeByAssignment = new Map(
    exegesisSessions.filter(s => s.grade != null && s.assignmentId).map(s => [s.assignmentId as string, s.grade as number]),
  )
  function scoreFor(a: { id: string; type: string }): number | null {
    if (a.type === 'TRANSLATION_EXERCISE') return gradeByAssignment.get(a.id) ?? null
    return bestPctByAssignment.get(a.id) ?? null
  }

  const allAssignments = enrollments.flatMap(e => e.course.assignments)
  const completedIds = new Set(completedResponses.map(r => r.assignmentId))
  // A submitted translation exercise is also "completed" (it has no quiz Response rows).
  for (const s of exegesisSessions) {
    if (s.submittedAt && s.assignmentId) completedIds.add(s.assignmentId)
  }
  const pending = allAssignments.filter(a => !completedIds.has(a.id) && new Date(a.dueDate) >= new Date())

  const serializedPending: Assignment[] = pending.slice(0, 5).map(a => ({
    id: a.id,
    courseId: a.courseId,
    createdById: a.createdById,
    title: a.title,
    type: a.type as Assignment['type'],
    weekNumber: a.weekNumber,
    dueDate: a.dueDate.toISOString(),
    level: a.level as Assignment['level'],
    reference: a.reference ?? undefined,
    instructions: a.instructions ?? undefined,
    timePerQuestion: a.timePerQuestion,
    allowLate: a.allowLate,
    lateDaysLimit: a.lateDaysLimit,
    isPublished: a.isPublished,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  const recentScores = recentAttempts.map(a => ({
    assignmentId: a.assignmentId,
    title: a.assignment.title,
    percentage: a.percentage,
    completedAt: a.completedAt.toISOString(),
  }))

  // Enrolled courses for the "My Courses" card — each with its own grade book
  // (assignments grouped by type, the student's score per assignment).
  const courses = enrollments.slice(0, 5).map(e => {
    const published = e.course.assignments.filter(a => a.isPublished)
    const gradebookRows = published
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(a => ({ id: a.id, title: a.title, weekNumber: a.weekNumber, type: a.type as string, pct: scoreFor(a) }))
    return {
      id: e.course.id,
      name: e.course.name,
      assignmentCount: published.length,
      instructorName: [e.course.instructor.title, e.course.instructor.firstName, e.course.instructor.surname].filter(Boolean).join(' '),
      instructorEmail: e.course.instructor.email,
      gradebookRows,
    }
  })

  return (
    <DashboardShell role="STUDENT" pageTitle="Dashboard">
      <StudentDashboard
        studentName={user?.firstName ?? 'Student'}
        pendingAssignments={serializedPending}
        recentScores={recentScores}
        courses={courses}
      />
    </DashboardShell>
  )
}
