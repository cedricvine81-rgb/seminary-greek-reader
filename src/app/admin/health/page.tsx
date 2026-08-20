import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getSystemHealth } from '@/lib/system-health'
import { HealthView } from '@/components/admin/HealthView'

export const metadata: Metadata = { title: 'System health' }
export const dynamic = 'force-dynamic'

// Capacity, as opposed to /admin/errors which covers what has already broken. Auth and fetching
// live here; everything visual is in HealthView, which takes the readings as a prop so the layout
// can be rendered and checked against real data without an admin session.
export default async function AdminHealthPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  return (
    <DashboardShell role="ADMIN" pageTitle="System health">
      <HealthView health={await getSystemHealth()} />
    </DashboardShell>
  )
}
