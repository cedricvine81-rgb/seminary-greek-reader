import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentMaterials } from '@/components/materials/StudentMaterials'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'

export const metadata: Metadata = { title: 'Materials' }

export default async function StudentMaterialsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  return (
    <DashboardShell role="STUDENT" pageTitle="Materials" pageDescription="Files your instructors have shared with your courses.">
      <StudentMaterials />
    </DashboardShell>
  )
}
