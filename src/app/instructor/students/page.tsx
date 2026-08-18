import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentProgressTable } from '@/components/instructor/StudentProgressTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCourseReport } from '@/lib/reports'

export const metadata: Metadata = { title: 'Students' }

export default async function InstructorStudentsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  // Built from getCourseReport, which already computes these figures correctly and
  // counts only APPROVED enrolments. This page used to hardcode `completedAssignments: 0`
  // and `averageScore: null` — so every student read "0 of 25, no average" all semester —
  // and it took `totalAssignments` from whichever course the student happened to appear in
  // first, which is the wrong denominator for anyone enrolled in two. It also listed
  // pending and denied requests as if they were students.
  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub },
    select: { id: true },
  })
  const reports = await Promise.all(courses.map(c => getCourseReport(c.id)))

  // A student in two of this instructor's courses gets one row per course, since the
  // completed/total counts and the average are per course and cannot be summed.
  const students = reports.flatMap(r =>
    (r?.studentStats ?? []).map(st => ({ ...st, courseName: r!.courseName })),
  )

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Students">
      <StudentProgressTable students={students} />
    </DashboardShell>
  )
}
