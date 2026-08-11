import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
import { AuthLanguagePicker } from '@/components/auth/AuthLanguagePicker'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Sign In' }

export default function SignInPage() {
  const t = getServerT()
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">{t('auth.signIn')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('auth.welcomeBack')}</p>
          </div>
          <SignInForm />
          <p className="text-center text-sm text-gray-500 mt-4">
            {t('auth.noAccount')}{' '}
            <Link href="/auth/sign-up" className="text-brand-600 hover:underline font-medium">{t('auth.signUpLink')}</Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            <Link href="/" className="hover:text-brand-600 hover:underline transition-colors">
              {t('auth.returnHome')}
            </Link>
          </p>
          {/* Language choice, in the card rather than only in the header: this is the first
              screen, and a globe icon above an all-English card is not an invitation. */}
          <AuthLanguagePicker className="mt-5 border-t border-parchment-200 pt-4" />
        </div>
      </div>
    </main>
  )
}
