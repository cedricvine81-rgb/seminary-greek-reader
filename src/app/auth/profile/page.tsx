import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProfileForm } from '@/components/auth/ProfileForm'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Edit Profile' }

export default async function ProfilePage() {
  const t = getServerT()
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/auth/sign-in')

  const [user, institutionRecords] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true, institution: true },
    }),
    prisma.institution.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!user) redirect('/auth/sign-in')

  const institutions = institutionRecords.map(i => i.name)

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">{t('auth.editProfile')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('auth.updateNameInstitution')}</p>
          </div>
          <ProfileForm
            initialFirstName={user.firstName}
            initialSurname={user.surname}
            initialInstitution={user.institution ?? null}
            institutions={institutions}
          />
        </div>
      </div>
    </main>
  )
}
