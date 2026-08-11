'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useT } from '@/lib/i18n/LocaleProvider'

export function SignInForm() {
  const router = useRouter()
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('auth.signInFailed'))
      // If the admin created this account with a temporary password, force the
      // user through the change-password screen before they can use the app.
      if (data.mustChangePassword) {
        router.push('/auth/change-password?required=1')
      } else {
        // On mobile (below the `lg` breakpoint the sidebar uses), land on the Reader
        // instead of the role dashboard. Desktop keeps the dashboard landing.
        const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
        const dashboard = data.role === 'ADMIN' ? '/admin' : data.role === 'INSTRUCTOR' ? '/instructor' : '/student'
        router.push(isMobile ? '/reader' : dashboard)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signInFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('auth.email')}
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={t('auth.emailExample')}
      />
      <Input
        label={t('auth.password')}
        type="password"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">{t('auth.signIn')}</Button>

    </form>
  )
}
