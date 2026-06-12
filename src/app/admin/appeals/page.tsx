import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminAppealsTable } from '@/components/admin/AdminAppealsTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Vocab Appeals' }

export default async function AdminAppealsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Vocab Appeals" pageDescription="Decide whether instructor-accepted appeals add their answer to the global lexicon.">
      <AdminAppealsTable />
    </DashboardShell>
  )
}
