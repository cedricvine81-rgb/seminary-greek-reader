import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { Role } from '@/types/auth'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/auth/sign-in')

  const [user, userInstitutions, institutionRecords] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true, title: true, institution: true },
    }),
    prisma.user.findMany({
      where: { institution: { not: null } },
      select: { institution: true },
      distinct: ['institution'],
    }),
    prisma.institution.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!user) redirect('/auth/sign-in')

  const institutions = Array.from(
    new Set([
      ...institutionRecords.map(i => i.name),
      ...userInstitutions.map(u => u.institution as string).filter(Boolean),
    ])
  ).sort()

  return (
    <DashboardShell role={payload.role as Role} pageTitle="Settings">
      <SettingsForm
        initialFirstName={user.firstName}
        initialSurname={user.surname}
        initialTitle={user.title ?? null}
        initialInstitution={user.institution ?? null}
        institutions={institutions}
      />
    </DashboardShell>
  )
}
