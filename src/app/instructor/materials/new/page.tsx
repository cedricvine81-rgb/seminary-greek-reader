import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MaterialUploadForm } from '@/components/materials/MaterialUploadForm'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Upload Material' }

export default async function NewMaterialPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const course = await prisma.course.findFirst({ where: { instructorId: payload.sub }, select: { id: true } })

  if (!course) {
    return (
      <DashboardShell role="INSTRUCTOR" pageTitle="Upload Material">
        <p className="text-sm text-gray-500">Create a course first.</p>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Upload Material">
      <MaterialUploadForm courseId={course.id} />
    </DashboardShell>
  )
}
