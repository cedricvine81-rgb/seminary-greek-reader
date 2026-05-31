import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AssignmentTable } from '@/components/instructor/AssignmentTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Plus, Copy } from 'lucide-react'

export const metadata: Metadata = { title: 'Assignments' }

export default async function InstructorAssignmentsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [
        { createdById: payload.sub },
        { course: { coInstructors: { some: { userId: payload.sub } } } },
      ],
    },
    select: {
      id: true, title: true, type: true, weekNumber: true, dueDate: true,
      instructions: true, isPublished: true,
      course: { select: { name: true, id: true } },
      _count: { select: { questions: true } },
    },
    orderBy: [{ dueDate: 'asc' }, { weekNumber: 'asc' }],
  })

  // Fetch best-attempt stats per assignment and enrollment counts per course
  const assignmentIds = assignments.map(a => a.id)
  const courseIds = [...new Set(assignments.map(a => a.course.id))]

  const [bestAttempts, enrollmentCounts] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { assignmentId: { in: assignmentIds }, isBest: true },
      select: { assignmentId: true, userId: true, percentage: true },
    }),
    prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { userId: true },
    }),
  ])

  const enrollmentMap = Object.fromEntries(
    enrollmentCounts.map(e => [e.courseId, e._count.userId])
  )

  const statsMap = assignmentIds.reduce<Record<string, { submitted: number; enrolled: number; avgPct: number | null }>>((acc, id) => {
    const attempts = bestAttempts.filter(a => a.assignmentId === id)
    const assignment = assignments.find(a => a.id === id)!
    const enrolled = enrollmentMap[assignment.course.id] ?? 0
    const avgPct = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : null
    acc[id] = { submitted: attempts.length, enrolled, avgPct }
    return acc
  }, {})

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Assignments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/instructor/assignments/new"
            className="flex items-start gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 hover:bg-brand-100 transition-colors group"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white group-hover:bg-brand-700 transition-colors">
              <Plus size={18} />
            </span>
            <div>
              <p className="font-semibold text-brand-900">Create New Assignments</p>
              <p className="text-sm text-brand-700 mt-0.5">
                Build individual assignments or generate a full semester schedule.
              </p>
            </div>
          </Link>

          <Link
            href="/instructor/assignments/use-existing"
            className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 hover:bg-gray-100 transition-colors group"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-700 text-white group-hover:bg-gray-800 transition-colors">
              <Copy size={18} />
            </span>
            <div>
              <p className="font-semibold text-gray-900">Use Existing Assignments</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Copy assignments from another course — questions included.
              </p>
            </div>
          </Link>
        </div>

        <AssignmentTable assignments={assignments} statsMap={statsMap} />
      </div>
    </DashboardShell>
  )
}
