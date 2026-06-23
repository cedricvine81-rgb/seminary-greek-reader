import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { FileManager } from '@/components/materials/FileManager'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Materials' }

export default async function InstructorMaterialsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  const courses = await prisma.course.findMany({
    where: { instructorId: payload.sub, isArchived: false },
    select: { id: true, name: true },
    orderBy: { startDate: 'desc' },
  })

  return (
    <DashboardShell
      role="INSTRUCTOR"
      pageTitle="Materials"
      pageDescription="Organise files into folders and share them with your courses."
    >
      <FileManager courses={courses} />
    </DashboardShell>
  )
}
