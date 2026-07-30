import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export default async function AdminUsersPage({ searchParams }: { searchParams: { pending?: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Users">
      {/* ?pending=1 — the admin dashboard's "awaiting approval" card lands straight on them. */}
      <AdminUsersTable initialPendingOnly={searchParams?.pending === '1'} />
    </DashboardShell>
  )
}
