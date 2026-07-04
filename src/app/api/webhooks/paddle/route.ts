import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPaddleWebhookSignature, mapPaddleSubscriptionStatus } from '@/lib/paddle'
import { logError, logWarn, logInfo } from '@/lib/logger'

// Paddle Billing subscription webhook payload (snake_case, as sent over the wire —
// intentionally not typed against the node SDK, since we verify/parse manually).
interface PaddleSubscriptionEvent {
  event_id: string
  event_type: string
  data: {
    id: string                    // sub_...
    customer_id: string           // ctm_...
    status: string                // active | trialing | past_due | paused | canceled
    current_billing_period?: { starts_at: string; ends_at: string } | null
    scheduled_change?: { action: string; effective_at: string } | null
    custom_data?: Record<string, unknown> | null
  }
}

// POST /api/webhooks/paddle — the only writer of subscription state on User.
// Public (unauthenticated) route — trust is established via HMAC signature, not
// the session cookie. Registered in middleware.ts's public prefix list.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('paddle-signature')

  if (!verifyPaddleWebhookSignature(rawBody, signature)) {
    logWarn('api/webhooks/paddle', { reason: 'invalid signature' })
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let event: PaddleSubscriptionEvent
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  try {
    const { event_type, data } = event
    if (!event_type.startsWith('subscription.')) {
      // Not something we track (e.g. transaction.* events) — acknowledge and ignore.
      return NextResponse.json({ ok: true })
    }

    const userId = data.custom_data?.userId
    if (typeof userId !== 'string') {
      logWarn('api/webhooks/paddle', { reason: 'missing custom_data.userId', event_type, subscriptionId: data.id })
      return NextResponse.json({ ok: true })
    }

    if (event_type === 'subscription.canceled') {
      // Match the specific subscription, not just the user: if the student already
      // resubscribed (a new paddleSubscriptionId is stored), a late `canceled` event
      // for the OLD subscription must not flip their new active one to CANCELED.
      await prisma.user.updateMany({
        where: { id: userId, paddleSubscriptionId: data.id },
        data: { subscriptionStatus: 'CANCELED', subscriptionCancelAtPeriodEnd: false },
      })
    } else {
      await prisma.user.updateMany({
        where: { id: userId },
        data: {
          paddleCustomerId: data.customer_id,
          paddleSubscriptionId: data.id,
          subscriptionStatus: mapPaddleSubscriptionStatus(data.status),
          subscriptionCurrentPeriodEnd: data.current_billing_period?.ends_at
            ? new Date(data.current_billing_period.ends_at)
            : undefined,
          subscriptionCancelAtPeriodEnd: data.scheduled_change?.action === 'cancel',
        },
      })
    }

    logInfo('api/webhooks/paddle', { event_type, userId, subscriptionId: data.id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/webhooks/paddle', err, { event_type: event.event_type })
    // 500 so Paddle retries — this is a transient/internal failure, not a bad payload.
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
