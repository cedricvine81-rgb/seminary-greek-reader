import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BookOpen, Users, ClipboardList, Plus, Copy, FileText, Eye, Settings } from 'lucide-react'
import { EnrollmentRequests } from '@/components/instructor/EnrollmentRequests'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

export default async function InstructorPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const [rawCourses, archivedCount, user] = await Promise.all([
    prisma.course.findMany({
      where: {
        isArchived: false,
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
      include: {
        _count: {
          select: {
            assignments: true,
            enrollments: { where: { status: 'APPROVED' } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    }),
    prisma.course.count({
      where: {
        isArchived: true,
        OR: [
          { instructorId: payload.sub },
          { coInstructors: { some: { userId: payload.sub } } },
        ],
      },
    }),
    prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true },
    }),
  ])

  const courseIds = rawCourses.map(c => c.id)

  const [totalAssignments, totalStudents, pendingEnrollments] = await Promise.all([
    prisma.assignment.count({ where: { courseId: { in: courseIds } } }),
    prisma.enrollment.groupBy({
      by: ['userId'],
      where: { courseId: { in: courseIds }, status: 'APPROVED', user: { deletedAt: null } },
    }).then(r => r.length),
    prisma.enrollment.findMany({
      where: { courseId: { in: courseIds }, status: 'PENDING', user: { deletedAt: null } },
      select: {
        id: true,
        createdAt: true,
        user: { select: { firstName: true, surname: true, email: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const instructorName = user ? `${user.firstName} ${user.surname}`.trim() : 'Instructor'

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Dashboard" pendingCount={pendingEnrollments.length}>
      <div className="space-y-8">

        {/* ── Enrollment requests banner ── */}
        <EnrollmentRequests
          pending={pendingEnrollments.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))}
        />

        {/* ── Welcome + stats ── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome back, {instructorName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Select a course to manage it, or create a new one.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Active Courses',    value: rawCourses.length,  icon: <BookOpen size={18} />,     color: 'text-blue-600 bg-blue-50' },
              { label: 'Enrolled Students', value: totalStudents,       icon: <Users size={18} />,        color: 'text-green-600 bg-green-50' },
              { label: 'Assignments',       value: totalAssignments,    icon: <ClipboardList size={18} />, color: 'text-purple-600 bg-purple-50' },
            ].map(s => (
              <Card key={s.label} className="flex items-center gap-3 p-4">
                <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick-action toolbar */}
          <div className="flex flex-wrap gap-2">
            <Link href="/instructor/courses/new">
              <Button size="sm" variant="primary" className="flex items-center gap-1.5">
                <Plus size={14} /> New Course
              </Button>
            </Link>
            <Link href="/instructor/assignments/new">
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                <ClipboardList size={14} /> New Assignment
              </Button>
            </Link>
            <Link href="/instructor/assignments/use-existing">
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                <Copy size={14} /> Use Existing
              </Button>
            </Link>
            <Link href="/instructor/materials">
              <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                <FileText size={14} /> Materials
              </Button>
            </Link>
            <a href="/api/preview?mode=enter">
              <Button size="sm" variant="ghost" className="flex items-center gap-1.5 text-amber-700 hover:bg-amber-50">
                <Eye size={14} /> Preview Student View
              </Button>
            </a>
            {archivedCount > 0 && (
              <Link href="/instructor/archive">
                <Button size="sm" variant="ghost" className="flex items-center gap-1.5 text-gray-500">
                  📦 Archive ({archivedCount})
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* ── Course cards ── */}
        {rawCourses.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-400 italic text-center py-6">
              No courses yet. Create your first course to get started.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Courses</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rawCourses.map(course => {
                const studentCount = course._count.enrollments
                const assignmentCount = course._count.assignments
                return (
                  <Card key={course.id} hover className="flex flex-col gap-3 p-4">
                    {/* Course name */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="text-base font-semibold text-gray-900 hover:text-brand-700 transition-colors leading-snug block truncate"
                      >
                        {course.name}
                      </Link>
                      {course.listing && (
                        <p className="text-xs text-gray-400 mt-0.5">{course.listing}</p>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {format(new Date(course.startDate), 'MMM d')} –{' '}
                        {format(new Date(course.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {studentCount} student{studentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardList size={12} /> {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <Link href={`/instructor/courses/${course.id}`} className="flex-1">
                        <Button size="sm" variant="primary" className="w-full justify-center">
                          Open Course
                        </Button>
                      </Link>
                      <Link href={`/instructor/courses/${course.id}/edit`}>
                        <Button size="sm" variant="secondary" className="flex items-center gap-1.5 px-3">
                          <Settings size={13} /> Edit
                        </Button>
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  )
}
