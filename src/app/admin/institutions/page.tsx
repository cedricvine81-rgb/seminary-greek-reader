import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminInstitutionsTable } from '@/components/admin/AdminInstitutionsTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export default async function AdminInstitutionsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Institutions">
      <AdminInstitutionsTable />
    </DashboardShell>
  )
}
