import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { CourseEnrollment } from '@/components/student/CourseEnrollment'
import { PendingEnrollments } from '@/components/student/PendingEnrollments'
import { isPreviewMode } from '@/lib/preview'

export const metadata: Metadata = { title: 'My Courses' }

const courseIncludes = {
  instructor: { select: { firstName: true, surname: true, title: true } },
  institution: { select: { name: true } },
  _count: { select: { enrollments: { where: { status: 'APPROVED' as const } }, assignments: true } },
} as const

export default async function StudentCoursesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const student = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { institution: true },
  })

  const hasInstitution = Boolean(student?.institution)
  const notEnrolled = { enrollments: { none: { userId: payload.sub } } }

  const preview = isPreviewMode()

  const [approvedEnrollments, pendingEnrollments, openCourses, institutionCourses] = await Promise.all([
    // Approved enrollments
    prisma.enrollment.findMany({
      where: { userId: payload.sub, status: 'APPROVED' },
      include: {
        course: {
          include: {
            instructor: { select: { firstName: true, surname: true, title: true } },
            _count: { select: { assignments: true, enrollments: { where: { status: 'APPROVED' } } } },
          },
        },
      },
    }),

    // Pending requests
    prisma.enrollment.findMany({
      where: { userId: payload.sub, status: 'PENDING' },
      include: {
        course: {
          include: { instructor: { select: { firstName: true, surname: true, title: true } } },
        },
      },
    }),

    // Open courses (no institution attached) — available to everyone
    prisma.course.findMany({
      where: { institutionId: null, ...notEnrolled },
      include: courseIncludes,
      orderBy: { startDate: 'desc' },
    }),

    // Institution courses — filtered by student's institution if they have one,
    // otherwise ALL institution courses (shown as "Request Access")
    hasInstitution
      ? prisma.course.findMany({
          where: {
            institutionId: { not: null },
            institution: { name: student!.institution! },
            ...notEnrolled,
          },
          include: courseIncludes,
          orderBy: { startDate: 'desc' },
        })
      : prisma.course.findMany({
          where: { institutionId: { not: null }, ...notEnrolled },
          include: courseIncludes,
          orderBy: [{ institution: { name: 'asc' } }, { startDate: 'desc' }],
        }),
  ])

  return (
    <DashboardShell role="STUDENT" pageTitle="My Courses">
      <div className="space-y-10">

        {/* ── Enrolled courses ── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Enrolled Courses</h2>
          {approvedEnrollments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">You are not enrolled in any courses yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedEnrollments.map(e => {
                const instructorName = [
                  e.course.instructor.title,
                  e.course.instructor.firstName,
                  e.course.instructor.surname,
                ].filter(Boolean).join(' ')
                return (
                  <Card key={e.courseId} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{e.course.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500">{instructorName}</p>
                    <p className="text-xs text-gray-400">
                      {e.course._count.assignments} assignments · {e.course._count.enrollments} students
                    </p>
                    <Link href="/student/assignments" className="text-sm text-brand-600 hover:underline">
                      View assignments →
                    </Link>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Pending requests — polls every 10 s and refreshes when approved ── */}
        <PendingEnrollments pending={pendingEnrollments.map(e => ({
          courseId: e.courseId,
          course: { name: e.course.name, instructor: e.course.instructor },
        }))} />

        {/* ── Open courses (no institution) ── */}
        <CourseEnrollment
          initialCourses={openCourses}
          sectionTitle="Available Courses"
          sectionDescription="Open courses you can request to join. Your instructor will confirm your place."
          buttonLabel="Request to Join"
          isPreview={preview}
        />

        {/* ── Institution courses ── */}
        {hasInstitution ? (
          <CourseEnrollment
            initialCourses={institutionCourses}
            sectionTitle={`Courses at ${student!.institution}`}
            sectionDescription="Courses run by your institution. Request to join and your instructor will approve."
            buttonLabel="Request to Join"
            isPreview={preview}
          />
        ) : (
          <CourseEnrollment
            initialCourses={institutionCourses}
            sectionTitle="Institutional Courses"
            sectionDescription="These courses are run by specific institutions. You can request access — the instructor will review your application."
            buttonLabel="Request Access"
            showInstitution
            isPreview={preview}
          />
        )}

      </div>
    </DashboardShell>
  )
}
