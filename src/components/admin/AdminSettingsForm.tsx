'use client'
import { useEffect, useState } from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormMessage } from '@/components/ui/FormMessage'
import { Loader2 } from 'lucide-react'

/**
 * Admin form for the addresses notified when a new instructor registers. Two fields —
 * a primary and an optional second address — persisted via /api/admin/settings.
 */
export function AdminSettingsForm() {
  const [primary, setPrimary] = useState('')
  const [second, setSecond] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'sending' | 'sent' | string>('idle')

  async function sendTest() {
    setTestState('sending')
    try {
      const res = await fetch('/api/admin/test-email', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      setTestState(res.ok ? 'sent' : (body.error ?? 'Send failed.'))
    } catch {
      setTestState('Send failed.')
    }
  }

  useEffect(() => {
    let alive = true
    fetch('/api/admin/settings')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (alive) { setPrimary(d.instructorNotifyEmail ?? ''); setSecond(d.instructorNotifyEmail2 ?? '') } })
      .catch(() => { if (alive) setError('Could not load settings.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorNotifyEmail: primary, instructorNotifyEmail2: second }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error ?? 'Could not save settings.'); return }
      setPrimary(d.instructorNotifyEmail ?? ''); setSecond(d.instructorNotifyEmail2 ?? '')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle>New-instructor notifications</CardTitle>
      <CardDescription>
        When someone registers as an instructor, an email is sent to these addresses so they can be approved.
        Leave a field blank to disable it.
      </CardDescription>

      {loading ? (
        <p className="text-sm text-gray-400 py-4"><Loader2 size={15} className="inline animate-spin" /> Loading…</p>
      ) : (
        <div className="mt-5 space-y-4 max-w-lg">
          <Input
            label="Notification email"
            type="email"
            value={primary}
            onChange={e => { setPrimary(e.target.value); setSaved(false) }}
            placeholder="admin@seminarygreek.app"
          />
          <Input
            label="Second notification email (optional)"
            type="email"
            value={second}
            onChange={e => { setSecond(e.target.value); setSaved(false) }}
            placeholder="another@example.com"
          />
          {error && <FormMessage kind="error">{error}</FormMessage>}
          {saved && <FormMessage kind="success">Settings saved.</FormMessage>}
          <Button onClick={save} loading={saving} size="sm">Save</Button>

          {/* Proves the whole Resend pipeline (env vars, domain verification, API) by
              sending to the signed-in admin's own address. */}
          <div className="border-t border-gray-100 pt-4">
            <Button onClick={sendTest} loading={testState === 'sending'} size="sm" variant="secondary">
              Send me a test email
            </Button>
            {testState === 'sent' && <FormMessage kind="success">Sent — check your inbox.</FormMessage>}
            {testState !== 'idle' && testState !== 'sending' && testState !== 'sent' && (
              <FormMessage kind="error">{testState}</FormMessage>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
