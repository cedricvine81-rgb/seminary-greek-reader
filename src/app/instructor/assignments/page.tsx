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
    include: { course: { select: { name: true } }, _count: { select: { questions: true } } },
    orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
  })

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

        <AssignmentTable assignments={assignments} />
      </div>
    </DashboardShell>
  )
}
