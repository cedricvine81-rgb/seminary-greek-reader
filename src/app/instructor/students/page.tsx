import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Students' }

export default async function InstructorStudentsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub },
    include: {
      enrollments: { include: { user: true } },
      _count: { select: { assignments: true } },
    },
  })

  const studentMap = new Map<string, { userId: string; name: string; email: string; completedAssignments: number; totalAssignments: number; averageScore: number | null }>()

  for (const course of courses) {
    for (const enrollment of course.enrollments) {
      if (!studentMap.has(enrollment.userId)) {
        studentMap.set(enrollment.userId, {
          userId: enrollment.userId,
          name: `${enrollment.user.firstName} ${enrollment.user.surname}`,
          email: enrollment.user.email,
          completedAssignments: 0,
          totalAssignments: course._count.assignments,
          averageScore: null,
        })
      }
    }
  }

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Students">
      <StudentProgressTable students={Array.from(studentMap.values())} />
    </DashboardShell>
  )
}
