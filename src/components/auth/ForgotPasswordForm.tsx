'use client'

// Request half of the self-service reset. The success screen is deliberately identical for a
// registered address, an unknown one and a rate-limited caller — the API answers the same way
// for all three, and saying "no such account" here would hand out a list of who is enrolled.

import { useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/LocaleProvider'

export function ForgotPasswordForm() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setState('sending')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-password-reset', email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error === 'email_not_configured'
          ? t('auth.forgot.unavailableBody')
          : t('auth.error.generic'))
        setState('idle')
        return
      }
      setState('sent')
    } catch {
      setError(t('auth.error.generic'))
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-ink-900">{t('auth.forgot.sentTitle')}</h2>
        <p className="text-sm text-gray-600">{t('auth.forgot.sentBody')}</p>
        <Link href="/auth/sign-in" className="inline-block text-sm text-brand-600 hover:underline font-medium">
          {t('auth.forgot.backToSignIn')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-600">{t('auth.forgot.lead')}</p>
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.forgot.emailLabel')}
        </label>
        <input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="input w-full"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={state === 'sending'} className="btn btn-primary w-full">
        {state === 'sending' ? t('auth.forgot.sending') : t('auth.forgot.submit')}
      </button>
      <p className="text-center text-sm text-gray-500">
        <Link href="/auth/sign-in" className="text-brand-600 hover:underline font-medium">
          {t('auth.forgot.backToSignIn')}
        </Link>
      </p>
    </form>
  )
}
