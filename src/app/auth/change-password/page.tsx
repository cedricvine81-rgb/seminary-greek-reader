import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Change Password' }

export default function ChangePasswordPage({ searchParams }: { searchParams: { required?: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload) redirect('/auth/sign-in')
  const required = searchParams?.required === '1'
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">{required ? 'Set Your Password' : 'Change Password'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {required
                ? 'An admin created your account with a temporary password. Please choose a new password before continuing.'
                : 'Set a new password for your account'}
            </p>
          </div>
          {required && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You must set a new password before you can access the app.
            </div>
          )}
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  )
}
