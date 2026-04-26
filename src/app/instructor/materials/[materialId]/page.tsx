import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MaterialEditor } from '@/components/materials/MaterialEditor'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getMaterial } from '@/lib/materials'

export const metadata: Metadata = { title: 'Edit Material' }

export default async function EditMaterialPage({ params }: { params: { materialId: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const material = await getMaterial(params.materialId)
  if (!material) notFound()

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Edit Material">
      <MaterialEditor materialId={material.id} initialData={material} />
    </DashboardShell>
  )
}
