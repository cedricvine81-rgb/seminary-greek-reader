import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AtSign } from 'lucide-react'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { clsx } from 'clsx'
import { courseStatus, courseTiming, groupByStatus } from '@/lib/course-status'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { CourseEnrollment } from '@/components/student/CourseEnrollment'
import { PendingEnrollments } from '@/components/student/PendingEnrollments'
import { MessageInstructorButton } from '@/components/student/MessageInstructorButton'
import { MessageGroupButton } from '@/components/student/MessageGroupButton'
import { isPreviewMode } from '@/lib/preview'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'My Courses' }

const courseIncludes = {
  instructor: { select: { firstName: true, surname: true, title: true } },
  institution: { select: { name: true } },
  _count: { select: { enrollments: { where: { status: 'APPROVED' as const } }, assignments: true } },
} as const

export default async function StudentCoursesPage() {
  const t = getServerT()
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
            instructor: { select: { firstName: true, surname: true, title: true, email: true } },
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
    // otherwise ALL institution courses (shown as {t('courses.requestAccess')})
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
          <h2 className="text-base font-semibold text-gray-900">{t('courses.enrolled')}</h2>
          {approvedEnrollments.length === 0 ? (
            <p className="text-sm text-gray-400 italic">{t('grades.notEnrolled')}</p>
          ) : (
            <div className="space-y-5">
            {/* Grouped so a student sees the course they are actually taking first,
                with finished terms kept but pushed to the bottom. */}
            {groupByStatus(approvedEnrollments, e => ({ startDate: e.course.startDate, endDate: e.course.endDate }))
              .filter(g => g.items.length > 0).map(group => (
            <div key={group.status} className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {group.label}
              <span className="ml-1.5 font-normal normal-case text-gray-400">({group.items.length})</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map(e => {
                const instructorName = [
                  e.course.instructor.title,
                  e.course.instructor.firstName,
                  e.course.instructor.surname,
                ].filter(Boolean).join(' ')
                const status = courseStatus(e.course.startDate, e.course.endDate)
                return (
                  <Card key={e.courseId} className={clsx('space-y-2', status.edge,
                    status.status === 'past' && 'opacity-75')}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{e.course.name}</h3>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full border shrink-0', status.chip)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{instructorName}</p>
                    <p className="text-xs text-gray-400">
                      {e.course._count.assignments} assignments · {courseTiming(e.course.startDate, e.course.endDate)}
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Link href="/student/assignments" className="text-sm text-brand-600 hover:underline">
                        View assignments →
                      </Link>
                      <div className="flex items-center gap-3">
                        <MessageInstructorButton
                          courseId={e.courseId}
                          courseName={e.course.name}
                          instructorName={instructorName}
                        />
                        <MessageGroupButton courseId={e.courseId} />
                        {e.course.instructor.email && (
                          <a
                            href={`mailto:${encodeURIComponent(e.course.instructor.email)}?subject=${encodeURIComponent(`[${e.course.name}] `)}`}
                            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                            title={`Email ${instructorName} via your mail program`}
                          >
                            <AtSign size={14} /> Email
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
            </div>
            ))}
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
          sectionTitle={t('courses.available')}
          sectionDescription={t('courses.openDesc')}
          buttonLabel={t('courses.requestToJoin')}
          isPreview={preview}
        />

        {/* ── Institution courses ── */}
        {hasInstitution ? (
          <CourseEnrollment
            initialCourses={institutionCourses}
            sectionTitle={t('courses.atInstitution', { name: student!.institution ?? '' })}
            sectionDescription={t('courses.institutionDesc')}
            buttonLabel={t('courses.requestToJoin')}
            isPreview={preview}
          />
        ) : (
          <CourseEnrollment
            initialCourses={institutionCourses}
            sectionTitle={t('courses.institutional')}
            sectionDescription={t('courses.institutionalDesc')}
            buttonLabel={t('courses.requestAccess')}
            showInstitution
            isPreview={preview}
          />
        )}

      </div>
    </DashboardShell>
  )
}
