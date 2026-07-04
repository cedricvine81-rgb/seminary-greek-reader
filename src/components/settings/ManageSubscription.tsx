'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/lib/api-client'

interface SubscriptionInfo {
  status: 'NONE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'GRANDFATHERED'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const STATUS_BADGE: Record<SubscriptionInfo['status'], { label: string; variant: 'green' | 'amber' | 'red' | 'gray' }> = {
  ACTIVE:        { label: 'Active',        variant: 'green' },
  GRANDFATHERED: { label: 'Grandfathered', variant: 'green' },
  PAST_DUE:      { label: 'Past due',      variant: 'amber' },
  CANCELED:      { label: 'Canceled',      variant: 'red' },
  NONE:          { label: 'Not subscribed', variant: 'gray' },
}

export function ManageSubscription() {
  const { data, isLoading, mutate } = useApi<SubscriptionInfo>('/api/subscription')
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState('')
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)

  if (isLoading || !data) {
    return (
      <Card>
        <CardTitle>Subscription</CardTitle>
        <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
      </Card>
    )
  }

  const { currentPeriodEnd } = data
  const badge = STATUS_BADGE[data.status]
  const cancelScheduled = scheduledFor ?? (data.cancelAtPeriodEnd ? currentPeriodEnd : null)

  async function cancel() {
    if (!confirm(
      'Cancel your subscription? You will keep access until the end of your current billing period. No refund is issued for time already paid.'
    )) return
    setCanceling(true); setError('')
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? 'Could not cancel your subscription.'); return }
      setScheduledFor(body.effectiveAt ?? currentPeriodEnd)
      mutate()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setCanceling(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <CardTitle>Subscription</CardTitle>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {data.status === 'ACTIVE' && data.currentPeriodEnd && (
        <p className="text-sm text-gray-600">
          {cancelScheduled
            ? <>Access continues through <strong>{format(new Date(cancelScheduled), 'MMMM d, yyyy')}</strong>, then your subscription will not renew.</>
            : <>Renews on <strong>{format(new Date(data.currentPeriodEnd), 'MMMM d, yyyy')}</strong>.</>}
        </p>
      )}
      {data.status === 'GRANDFATHERED' && (
        <p className="text-sm text-gray-600">Your account predates the subscription requirement — no payment needed.</p>
      )}
      {(data.status === 'PAST_DUE' || data.status === 'CANCELED' || data.status === 'NONE') && (
        <p className="text-sm text-gray-600">
          <a href="/subscribe" className="text-brand-600 hover:underline font-medium">Subscribe</a> to regain access.
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {data.status === 'ACTIVE' && !cancelScheduled && (
        <div className="mt-4">
          <Button variant="danger" size="sm" onClick={cancel} loading={canceling}>Cancel subscription</Button>
          <p className="mt-1.5 text-xs text-gray-400">No refunds — you'll keep access through the period you already paid for.</p>
        </div>
      )}
    </Card>
  )
}
