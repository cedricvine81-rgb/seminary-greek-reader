import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { CourseEnrollment } from '@/components/student/CourseEnrollment'

export const metadata: Metadata = { title: 'My Courses' }

export default async function StudentCoursesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const student = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { institution: true },
  })

  const institutionFilter = student?.institution
    ? { institution: { name: student.institution } }
    : {}

  const [approvedEnrollments, pendingEnrollments, availableCourses] = await Promise.all([
    // Approved: courses the student is in
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
    // Pending: requests awaiting instructor approval
    prisma.enrollment.findMany({
      where: { userId: payload.sub, status: 'PENDING' },
      include: {
        course: {
          include: {
            instructor: { select: { firstName: true, surname: true, title: true } },
          },
        },
      },
    }),
    // Available: same institution, not yet requested or enrolled
    prisma.course.findMany({
      where: {
        ...institutionFilter,
        enrollments: { none: { userId: payload.sub } },
      },
      include: {
        instructor: { select: { firstName: true, surname: true, title: true } },
        institution: { select: { name: true } },
        _count: { select: { enrollments: { where: { status: 'APPROVED' } }, assignments: true } },
      },
      orderBy: { startDate: 'desc' },
    }),
  ])

  return (
    <DashboardShell role="STUDENT" pageTitle="My Courses">
      <div className="space-y-10">

        {/* Enrolled courses */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Enrolled Courses</h2>
          {approvedEnrollments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">You are not enrolled in any courses yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedEnrollments.map(e => {
                const instructorName = [e.course.instructor.title, e.course.instructor.firstName, e.course.instructor.surname].filter(Boolean).join(' ')
                return (
                  <Card key={e.courseId} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{e.course.name}</h3>
                      <Badge variant={COURSE_LEVEL_VARIANTS[e.course.level] ?? 'gray'}>
                        {COURSE_LEVEL_LABELS[e.course.level] ?? e.course.level}
                      </Badge>
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

        {/* Pending requests */}
        {pendingEnrollments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Pending Requests</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingEnrollments.map(e => {
                const instructorName = [e.course.instructor.title, e.course.instructor.firstName, e.course.instructor.surname].filter(Boolean).join(' ')
                return (
                  <Card key={e.courseId} className="space-y-2 border-amber-200 bg-amber-50">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{e.course.name}</h3>
                      <Badge variant="amber">Pending</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{instructorName}</p>
                    <p className="text-xs text-amber-700">Awaiting instructor approval</p>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Available courses */}
        <CourseEnrollment
          initialCourses={availableCourses}
          institutionName={student?.institution ?? null}
        />
      </div>
    </DashboardShell>
  )
}
