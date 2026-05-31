import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

export default async function InstructorPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  let step = 'start'
  let errorMsg = ''

  try {
    // Step 1: user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true },
    })
    step = `user ok (${user?.firstName})`

    // Step 2: courses
    const rawCourses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
      orderBy: { startDate: 'asc' },
    })
    step = `courses ok (${rawCourses.length})`

    const courseIds = rawCourses.map(c => c.id)

    // Step 3: assignments with questions
    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        id: true, title: true, type: true, weekNumber: true,
        dueDate: true, instructions: true, isPublished: true,
        courseId: true,
        _count: { select: { questions: true } },
        questions: { select: { points: true } },
      },
      orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
    })
    step = `assignments ok (${assignments.length})`

    // Step 4: enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        courseId: true,
        user: { select: { id: true, firstName: true, surname: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    step = `enrollments ok (${enrollments.length})`

    // Step 5: quiz attempts
    const allAssignmentIds = assignments.map(a => a.id)
    const bestAttempts = await prisma.quizAttempt.findMany({
      where: { assignmentId: { in: allAssignmentIds }, isBest: true },
      select: { userId: true, assignmentId: true, percentage: true },
    })
    step = `attempts ok (${bestAttempts.length})`

    // Step 6: responses
    const translationIds = assignments.filter(a => a.type === 'TRANSLATION_EXERCISE').map(a => a.id)
    const responses = translationIds.length > 0
      ? await prisma.response.findMany({
          where: { assignmentId: { in: translationIds }, questionId: { not: null } },
          select: { userId: true, assignmentId: true, score: true },
        })
      : []
    step = `responses ok (${responses.length})`

  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e)
  }

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Dashboard">
      <p className="text-sm font-mono text-gray-600">Last step: {step}</p>
      {errorMsg && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800 font-mono break-all">
          ERROR: {errorMsg}
        </div>
      )}
    </DashboardShell>
  )
}
