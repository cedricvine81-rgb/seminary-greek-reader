import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'My Courses' }

export default async function StudentCoursesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'STUDENT') redirect('/auth/sign-in')

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: payload.sub },
    include: { course: { include: { _count: { select: { assignments: true, enrollments: true } } } } },
  })

  return (
    <DashboardShell role="STUDENT" pageTitle="My Courses">
      {enrollments.length === 0 ? (
        <p className="text-sm text-gray-400 italic">You are not enrolled in any courses yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map(e => (
            <Card key={e.courseId} className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{e.course.name}</h3>
                <Badge variant={e.course.level === 'BEGINNING' ? 'blue' : 'purple'}>
                  {e.course.level === 'BEGINNING' ? 'Beginning' : 'Intermediate'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">{e.course._count.assignments} assignments · {e.course._count.enrollments} students</p>
              <Link href={`/student/assignments`} className="text-sm text-brand-600 hover:underline">
                View assignments →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
