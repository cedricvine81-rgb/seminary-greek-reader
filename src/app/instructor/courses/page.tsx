import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CourseTable } from '@/components/instructor/CourseTable'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Courses' }

export default async function InstructorCoursesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const mapped = courses.map(c => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    enrollmentCount: c._count.enrollments,
  }))

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle="Courses"
      actions={<Link href="/instructor/courses/new"><Button size="sm"><Plus size={14} /> New Course</Button></Link>}
    >
      <CourseTable courses={mapped} />
    </DashboardShell>
  )
}
