import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { MaterialList } from '@/components/materials/MaterialList'
import { Button } from '@/components/ui/Button'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Materials' }

export default async function InstructorMaterialsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({ where: { instructorId: payload.sub }, select: { id: true } })
  const materials = await prisma.material.findMany({
    where: { courseId: { in: courses.map(c => c.id) } },
    orderBy: [{ weekNumber: 'asc' }, { createdAt: 'desc' }],
  })

  const serialized = materials.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle="Materials"
      actions={<Link href="/instructor/materials/new"><Button size="sm"><Plus size={14} /> Upload</Button></Link>}
    >
      <MaterialList materials={serialized} canEdit />
    </DashboardShell>
  )
}
