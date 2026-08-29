import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { AuthLanguagePicker } from '@/components/auth/AuthLanguagePicker'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Choose a new password' }

export default function ResetPasswordPage() {
  const t = getServerT()
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">{t('auth.reset.title')}</h1>
          </div>
          {/* useSearchParams needs a Suspense boundary, or this page opts the whole route
              into client-side rendering at build time. */}
          <Suspense fallback={<p className="text-sm italic text-gray-400">{t('hw.loading')}</p>}>
            <ResetPasswordForm />
          </Suspense>
          <AuthLanguagePicker className="mt-5 border-t border-parchment-200 pt-4" />
        </div>
      </div>
    </main>
  )
}
