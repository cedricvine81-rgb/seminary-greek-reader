import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminAuditLog } from '@/components/admin/AdminAuditLog'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Audit Log' }

export default async function AdminAuditPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Audit Log" pageDescription="Read-only record of sensitive admin actions.">
      <AdminAuditLog />
    </DashboardShell>
  )
}
