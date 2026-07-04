import { createHmac, timingSafeEqual } from 'crypto'
import { SubscriptionStatus } from '@prisma/client'

if (!process.env.PADDLE_API_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('PADDLE_API_KEY environment variable must be set in production')
}
if (!process.env.PADDLE_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('PADDLE_WEBHOOK_SECRET environment variable must be set in production')
}

const PADDLE_API_BASE = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com'

/**
 * Verifies the `Paddle-Signature` header against the raw request body.
 * Header format: "ts=<unix-seconds>;h1=<hex-hmac>". The signed payload is
 * `${ts}:${rawBody}`, HMAC-SHA256'd with the webhook's signing secret.
 * Must run against the raw (unparsed) body — Paddle signs the exact bytes sent.
 */
export function verifyPaddleWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret || !signatureHeader) return false

  const parts = Object.fromEntries(
    signatureHeader.split(';').map(kv => kv.split('=') as [string, string])
  )
  const ts = parts.ts
  const h1 = parts.h1
  if (!ts || !h1) return false

  const expected = createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex')

  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(h1, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Schedules cancellation of a Paddle subscription at the end of the current billing
 * period — the student keeps access through what they already paid for, no refund is
 * issued, and no proration happens. Paddle later sends `subscription.canceled` once the
 * period actually ends, which is what flips our DB's subscriptionStatus to CANCELED.
 */
export async function paddleCancelSubscription(subscriptionId: string) {
  const res = await fetch(`${PADDLE_API_BASE}/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ effective_from: 'next_billing_period' }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Paddle cancel failed (${res.status}): ${body}`)
  }
  return res.json()
}

/** Maps a Paddle subscription `status` value to our internal enum. */
export function mapPaddleSubscriptionStatus(paddleStatus: string): SubscriptionStatus {
  switch (paddleStatus) {
    case 'active':
    case 'trialing':
      return SubscriptionStatus.ACTIVE
    case 'past_due':
      return SubscriptionStatus.PAST_DUE
    case 'paused':
    case 'canceled':
      return SubscriptionStatus.CANCELED
    default:
      return SubscriptionStatus.NONE
  }
}
