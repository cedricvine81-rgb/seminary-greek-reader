import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Instructor Dashboard' }

export default async function InstructorPage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  let info = 'loading...'
  let errorMsg = ''

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true },
    })
    info = `Hello ${user?.firstName ?? 'unknown'}`
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e)
  }

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Dashboard">
      <p className="text-lg font-semibold">{info}</p>
      {errorMsg && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800 font-mono break-all">
          ERROR: {errorMsg}
        </div>
      )}
    </DashboardShell>
  )
}
