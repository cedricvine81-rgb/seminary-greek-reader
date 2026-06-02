import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { WeeklyMaterialsView } from '@/components/materials/WeeklyMaterialsView'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { canViewStudentPages } from '@/lib/preview'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Materials' }

export default async function StudentMaterialsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!canViewStudentPages(payload)) redirect('/auth/sign-in')
  if (!payload) redirect('/auth/sign-in')

  const enrollments = await prisma.enrollment.findMany({ where: { userId: payload.sub, status: 'APPROVED' }, select: { courseId: true } })
  const materials = await prisma.material.findMany({
    where: { courseId: { in: enrollments.map(e => e.courseId) } },
    orderBy: [{ weekNumber: 'asc' }, { createdAt: 'desc' }],
  })

  const serialized = materials.map(m => ({ ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() }))

  return (
    <DashboardShell role="STUDENT" pageTitle="Materials">
      <WeeklyMaterialsView materials={serialized} />
    </DashboardShell>
  )
}
