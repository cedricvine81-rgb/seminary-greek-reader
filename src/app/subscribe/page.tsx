import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PaddleCheckout } from '@/components/subscribe/PaddleCheckout'

export const metadata: Metadata = { title: 'Subscribe' }

export default async function SubscribePage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/auth/sign-in')
  // Only students are ever paywalled — instructors/admins have no business here.
  if (payload.role !== 'STUDENT') redirect(payload.role === 'INSTRUCTOR' ? '/instructor' : '/')

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { email: true, subscriptionStatus: true },
  })
  if (!user) redirect('/auth/sign-in')
  if (user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'GRANDFATHERED') {
    redirect('/student')
  }

  const lapsed = user.subscriptionStatus === 'PAST_DUE' || user.subscriptionStatus === 'CANCELED'

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">
              {lapsed ? 'Renew your subscription' : 'Activate your account'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {lapsed
                ? 'Your subscription has lapsed. Renew to regain access to Seminary Greek.'
                : 'A $10/year subscription is required for student accounts.'}
            </p>
          </div>
          <PaddleCheckout userId={payload.sub} email={user.email} />
        </div>
      </div>
    </main>
  )
}
