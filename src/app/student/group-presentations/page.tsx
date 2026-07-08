import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentGroupPresentations } from '@/components/student/StudentGroupPresentations'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'

export const metadata: Metadata = { title: 'Group Presentations' }

export default function StudentGroupPresentationsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')

  return (
    <DashboardShell role="STUDENT" pageTitle="Group Presentations">
      <StudentGroupPresentations />
    </DashboardShell>
  )
}
