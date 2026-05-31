import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable'
import { CourseGradebook } from '@/components/instructor/CourseGradebook'
import { CoInstructorManager } from '@/components/instructor/CoInstructorManager'
import { DeleteCourseButton } from '@/components/instructor/DeleteCourseButton'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCourseReport } from '@/lib/reports'
import { Plus, Copy } from 'lucide-react'
import { COURSE_LEVEL_LABELS, COURSE_LEVEL_VARIANTS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Course Details' }

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
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
      assignments: { orderBy: { weekNumber: 'asc' } },
      coInstructors: { include: { user: { select: { id: true, firstName: true, surname: true, email: true } } } },
    },
  })
  if (!course) notFound()
  const isPrimaryInstructor = course.instructorId === payload.sub

  const report = await getCourseReport(params.courseId)

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle={course.name}
      actions={isPrimaryInstructor
        ? <DeleteCourseButton courseId={course.id} courseName={course.name} />
        : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant={COURSE_LEVEL_VARIANTS[course.level] ?? 'gray'}>
            {COURSE_LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
          <span className="text-sm text-gray-500">
            {new Date(course.startDate).toLocaleDateString()} – {new Date(course.endDate).toLocaleDateString()}
          </span>
        </div>

        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Assignments ({course.assignments.length})</CardTitle>
            <div className="flex gap-2">
              <Link href={`/instructor/assignments/new?courseId=${course.id}`}>
                <Button size="sm" variant="secondary">
                  <Plus size={14} />
                  Create New
                </Button>
              </Link>
              <Link href={`/instructor/assignments/use-existing?courseId=${course.id}`}>
                <Button size="sm" variant="secondary">
                  <Copy size={14} />
                  Use Existing
                </Button>
              </Link>
            </div>
          </div>
          {course.assignments.length === 0 ? (
            <p className="text-sm text-gray-400 italic mt-2">No assignments yet.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {course.assignments.map(a => (
                <li key={a.id} className="text-sm text-gray-700 flex justify-between">
                  <span>Week {a.weekNumber}: {a.title}</span>
                  <span className="text-gray-400 text-xs">{new Date(a.dueDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Co-Instructors</CardTitle>
          <CoInstructorManager
            courseId={course.id}
            initialCoInstructors={course.coInstructors}
            isPrimaryInstructor={isPrimaryInstructor}
          />
        </Card>

        <Card>
          <CardTitle>Student Progress</CardTitle>
          <div className="mt-3">
            <StudentProgressTable students={report?.studentStats ?? []} />
          </div>
        </Card>

        <Card>
          <CardTitle>Grade Book</CardTitle>
          <div className="mt-4">
            <CourseGradebook courseId={course.id} />
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
