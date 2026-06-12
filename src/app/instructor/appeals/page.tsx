import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AppealsTable } from '@/components/instructor/AppealsTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Vocab Appeals' }

export default async function InstructorAppealsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Vocab Appeals" pageDescription="Review student appeals on wrong vocab answers.">
      <AppealsTable />
    </DashboardShell>
  )
}
