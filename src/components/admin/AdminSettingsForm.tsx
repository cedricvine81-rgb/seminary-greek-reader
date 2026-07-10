'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'

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
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <Bell size={18} className="text-brand-600" />
        <h2 className="font-semibold text-gray-900">New-instructor notifications</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        When someone registers as an instructor, an email is sent to these addresses so they can be approved.
        Leave a field blank to disable it.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400 py-4"><Loader2 size={15} className="inline animate-spin" /> Loading…</p>
      ) : (
        <div className="space-y-4 max-w-md">
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
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex items-center gap-3">
            <Button onClick={save} loading={saving}>Save</Button>
            {saved && <span className="inline-flex items-center gap-1 text-sm text-green-600"><CheckCircle2 size={15} /> Saved</span>}
          </div>
        </div>
      )}
    </Card>
  )
}
