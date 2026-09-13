import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentGroupPresentations } from '@/components/student/StudentGroupPresentations'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'

export const metadata: Metadata = { title: 'Group Presentations' }

export default async function StudentGroupPresentationsPage() {
  const token = await getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!await canViewStudentPages(payload)) redirect('/auth/sign-in')

  return (
    <DashboardShell role="STUDENT" pageTitle="Group Presentations">
      <StudentGroupPresentations />
    </DashboardShell>
  )
}
