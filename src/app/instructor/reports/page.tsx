import { redirect } from 'next/navigation'
import Link from 'next/link'
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
    <DashboardShell role="INSTRUCTOR" pageTitle="Reports" pageDescription="Export semester summaries and student results.">
      <div className="space-y-10">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-800">Semester Summary Report</h2>
          <SemesterReportGenerator courses={courses} />
        </section>

        <div className="border-t border-gray-100" />

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Grade Book</h2>
          <p className="text-sm text-gray-500">
            Per-student scores are shown on the{' '}
            <Link href="/instructor" className="text-brand-600 hover:underline font-medium">
              Dashboard
            </Link>{' '}
            — open any course and click <span className="font-medium">View Gradebook</span>.
          </p>
        </section>
      </div>
    </DashboardShell>
  )
}
