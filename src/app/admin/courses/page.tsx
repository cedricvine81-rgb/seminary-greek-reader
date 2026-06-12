import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminCoursesTable } from '@/components/admin/AdminCoursesTable'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export default async function AdminCoursesPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Courses">
      <AdminCoursesTable />
    </DashboardShell>
  )
}
