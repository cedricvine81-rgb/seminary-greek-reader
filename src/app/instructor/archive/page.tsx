import { redirect } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { COURSE_LEVEL_VARIANTS } from '@/lib/constants'
import { ArchiveCourseButton } from '@/components/instructor/ArchiveCourseButton'
import { Users, ClipboardList } from 'lucide-react'

export const metadata: Metadata = { title: 'Course Archive' }

export default async function ArchivePage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: {
      isArchived: true,
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    include: {
      _count: { select: { enrollments: { where: { status: 'APPROVED' } }, assignments: true } },
    },
    orderBy: { endDate: 'desc' },
  })

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Course Archive">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Archived courses are hidden from your dashboard but all data is preserved.
          </p>
          <Link href="/instructor" className="text-sm text-brand-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-400 italic text-center py-8">
              No archived courses yet. Use the Archive button on any course to move it here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <Card key={course.id} className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="font-semibold text-gray-800 hover:text-brand-700"
                    >
                      {course.name}
                    </Link>
                    {course.listing && (
                      <span className="text-xs text-gray-400">{course.listing}</span>
                    )}
                    <Badge variant={COURSE_LEVEL_VARIANTS[course.level] ?? 'gray'}>
                      {t(`course.level.${course.level}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(course.startDate), 'MMM d, yyyy')} – {format(new Date(course.endDate), 'MMM d, yyyy')}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {course._count.enrollments} students
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList size={11} /> {course._count.assignments} assignments
                    </span>
                  </div>
                </div>
                <ArchiveCourseButton courseId={course.id} isArchived={true} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
