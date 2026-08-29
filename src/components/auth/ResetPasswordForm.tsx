'use client'

// Redeem half of the self-service reset. The token comes from the emailed link and is read
// from the query string on the client, so it is never handed to the server as part of a
// rendered page — only in the POST body.

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useT } from '@/lib/i18n/LocaleProvider'

export function ResetPasswordForm() {
  const t = useT()
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'invalid'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError(t('auth.reset.tooShort')); return }
    if (password !== confirm) { setError(t('auth.reset.mismatch')); return }

    setState('saving')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', token, password }),
      })
      if (res.ok) { setState('done'); return }
      const body = await res.json().catch(() => ({}))
      if (body?.error === 'invalid_token') { setState('invalid'); return }
      setError(body?.error === 'Password must be at least 8 characters.'
        ? t('auth.reset.tooShort')
        : t('auth.error.generic'))
      setState('idle')
    } catch {
      setError(t('auth.error.generic'))
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-ink-900">{t('auth.reset.doneTitle')}</h2>
        <p className="text-sm text-gray-600">{t('auth.reset.doneBody')}</p>
        <Link href="/auth/sign-in" className="btn btn-primary w-full inline-block text-center">
          {t('auth.reset.signInNow')}
        </Link>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-ink-900">{t('auth.reset.invalidTitle')}</h2>
        <p className="text-sm text-gray-600">{t('auth.reset.invalidBody')}</p>
        <Link href="/auth/forgot-password" className="btn btn-primary w-full inline-block text-center">
          {t('auth.reset.requestAnother')}
        </Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">{t('auth.reset.missingToken')}</p>
        <Link href="/auth/forgot-password" className="text-sm text-brand-600 hover:underline font-medium">
          {t('auth.reset.requestAnother')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-600">{t('auth.reset.lead')}</p>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.reset.newLabel')}
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input w-full"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.reset.confirmLabel')}
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="input w-full"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={state === 'saving'} className="btn btn-primary w-full">
        {state === 'saving' ? t('auth.reset.saving') : t('auth.reset.submit')}
      </button>
    </form>
  )
}
