import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { StudentMaterials } from '@/components/materials/StudentMaterials'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { getAccessibleFiles } from '@/lib/materials'

export const metadata: Metadata = { title: 'Materials' }

export default async function StudentMaterialsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const materials = await getAccessibleFiles(payload.sub)
  const items = materials.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    content: m.content,
    fileUrl: m.fileUrl,
    storagePath: m.storagePath,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    weekNumber: m.weekNumber,
  }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Materials" pageDescription="Files your instructors have shared with your courses.">
      <StudentMaterials items={items} />
    </DashboardShell>
  )
}
