import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminSettingsForm } from '@/components/admin/AdminSettingsForm'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin Settings' }

export default function AdminSettingsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="Settings">
      <AdminSettingsForm />
    </DashboardShell>
  )
}
