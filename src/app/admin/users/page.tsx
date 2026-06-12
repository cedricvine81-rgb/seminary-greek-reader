import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export default async function AdminUsersPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Users">
      <AdminUsersTable />
    </DashboardShell>
  )
}
