import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, FileText } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardTitle } from '@/components/ui/Card'
import { CourseEditInlineForm } from '@/components/instructor/CourseEditInlineForm'
import { CoInstructorManager } from '@/components/instructor/CoInstructorManager'
import { EnrollmentRequests } from '@/components/instructor/EnrollmentRequests'
import { ArchiveCourseButton } from '@/components/instructor/ArchiveCourseButton'
import { DeleteCourseButton } from '@/components/instructor/DeleteCourseButton'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Edit Course' }

export default async function EditCoursePage({ params }: { params: { courseId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const course = await prisma.course.findFirst({
    where: {
      id: params.courseId,
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    include: {
      institution: { select: { name: true } },
      coInstructors: {
        include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
      },
    },
  })
  if (!course) notFound()

  const isPrimaryInstructor = course.instructorId === payload.sub

  const [pendingEnrollments, materials] = await Promise.all([
    prisma.enrollment.findMany({
      where: { courseId: params.courseId, status: 'PENDING', user: { deletedAt: null } },
      select: {
        id: true,
        createdAt: true,
        user: { select: { firstName: true, surname: true, email: true } },
        course: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.material.findMany({
      where: { courseId: params.courseId },
      orderBy: [{ weekNumber: 'asc' }, { createdAt: 'desc' }],
    }),
  ])

  const toDateInput = (d: Date) => d.toISOString().split('T')[0]

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Edit Course">
      <div className="space-y-6 max-w-2xl">

        {/* Back link */}
        <Link
          href={`/instructor/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back to {course.name}
        </Link>

        {/* ── Course Details ── */}
        <Card>
          <CardTitle className="mb-4">Course Details</CardTitle>
          <CourseEditInlineForm
            courseId={course.id}
            initialName={course.name}
            initialListing={course.listing ?? ''}
            initialLevel={course.level}
            initialLanguage={course.language}
            initialStartDate={toDateInput(course.startDate)}
            initialEndDate={toDateInput(course.endDate)}
          />
          {course.institution && (
            <p className="mt-3 text-xs text-gray-400">
              Institution: <span className="text-gray-600">{course.institution.name}</span>
            </p>
          )}
        </Card>

        {/* ── Co-Instructors ── */}
        <Card>
          <CardTitle className="mb-3">Co-Instructors</CardTitle>
          <CoInstructorManager
            courseId={course.id}
            initialCoInstructors={course.coInstructors}
            isPrimaryInstructor={isPrimaryInstructor}
          />
        </Card>

        {/* ── Materials ── */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Course Materials</CardTitle>
            <Link
              href="/instructor/materials"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900 border border-brand-200 hover:bg-brand-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <FileText size={12} /> Manage materials
            </Link>
          </div>
          {materials.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No materials uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {materials.map(m => (
                <li key={m.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-gray-400 truncate">{m.description}</p>
                    )}
                    {m.weekNumber && (
                      <p className="text-xs text-gray-400">Week {m.weekNumber}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── Enrollment Requests ── */}
        {pendingEnrollments.length > 0 && (
          <EnrollmentRequests
            pending={pendingEnrollments.map(e => ({
              ...e,
              createdAt: e.createdAt.toISOString(),
            }))}
          />
        )}
        {pendingEnrollments.length === 0 && (
          <Card>
            <CardTitle className="mb-1">Enrollment Requests</CardTitle>
            <p className="text-sm text-gray-400 italic">No pending requests.</p>
          </Card>
        )}

        {/* ── Danger Zone ── */}
        {isPrimaryInstructor && (
          <Card className="border-red-100">
            <CardTitle className="mb-3 text-red-700">Danger Zone</CardTitle>
            <div className="flex flex-wrap gap-3">
              <ArchiveCourseButton courseId={course.id} isArchived={course.isArchived} />
              <DeleteCourseButton courseId={course.id} courseName={course.name} />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Archiving hides the course from your dashboard. Deletion is permanent and removes all
              assignments and student data.
            </p>
          </Card>
        )}

      </div>
    </DashboardShell>
  )
}
