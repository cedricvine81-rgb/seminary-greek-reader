import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SemesterReportGenerator } from '@/components/reports/SemesterReportGenerator'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub },
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Reports" pageDescription="View student progress and export results.">
      <SemesterReportGenerator courses={courses} />
    </DashboardShell>
  )
}
