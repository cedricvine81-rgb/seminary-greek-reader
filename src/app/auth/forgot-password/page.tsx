import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthLanguagePicker } from '@/components/auth/AuthLanguagePicker'
import { getServerT } from '@/lib/i18n/server'
import { emailConfigured } from '@/lib/email'

export const metadata: Metadata = { title: 'Reset your password' }

export default function ForgotPasswordPage() {
  const t = getServerT()
  // Checked on the server: with no mail keys the reset link can never arrive, so the page says
  // so plainly instead of showing a form that would end in an empty inbox. Set RESEND_API_KEY
  // and EMAIL_FROM and the form appears on its own — no code change.
  const canSend = emailConfigured()

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">
              {canSend ? t('auth.forgot.title') : t('auth.forgot.unavailableTitle')}
            </h1>
          </div>

          {canSend ? <ForgotPasswordForm /> : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('auth.forgot.unavailableBody')}</p>
              <Link href="/auth/sign-in" className="inline-block text-sm text-brand-600 hover:underline font-medium">
                {t('auth.forgot.backToSignIn')}
              </Link>
            </div>
          )}

          <AuthLanguagePicker className="mt-5 border-t border-parchment-200 pt-4" />
        </div>
      </div>
    </main>
  )
}
