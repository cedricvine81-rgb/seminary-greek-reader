import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCourseReport } from '@/lib/reports'

export const metadata: Metadata = { title: 'Course Details' }

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: { assignments: { orderBy: { weekNumber: 'asc' } } },
  })
  if (!course || course.instructorId !== payload.sub) notFound()

  const report = await getCourseReport(params.courseId)

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle={course.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant={course.level === 'BEGINNING' ? 'blue' : 'purple'}>
            {course.level === 'BEGINNING' ? 'Beginning' : 'Intermediate'}
          </Badge>
          <span className="text-sm text-gray-500">
            {new Date(course.startDate).toLocaleDateString()} – {new Date(course.endDate).toLocaleDateString()}
          </span>
        </div>

        <Card>
          <CardTitle>Assignments ({course.assignments.length})</CardTitle>
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
          <CardTitle>Student Progress</CardTitle>
          <div className="mt-3">
            <StudentProgressTable students={report?.studentStats ?? []} />
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
