/**
 * Tests for the Paddle webhook — the sole writer of subscription state, and a public
 * (unauthenticated) route whose only trust boundary is the HMAC signature. The subtle,
 * bug-prone parts are: (1) signature verification exactly matching Paddle's scheme
 * (`ts:rawBody`, HMAC-SHA256, timing-safe), and (2) the event→DB mapping, including the
 * guard that a late `subscription.canceled` for an OLD subscription can't flip a student
 * who has already resubscribed. Both are covered here without touching a real DB.
 */
import { createHmac } from 'crypto'

const TEST_SECRET = 'whsec_test_secret'
process.env.PADDLE_WEBHOOK_SECRET = TEST_SECRET

// Mock the DB before importing the route; capture the updateMany calls.
const userUpdateMany = jest.fn().mockResolvedValue({ count: 1 })
jest.mock('@/lib/db', () => ({ prisma: { user: { updateMany: (...a: unknown[]) => userUpdateMany(...a) } } }))
jest.mock('@/lib/logger', () => ({ logError: jest.fn(), logWarn: jest.fn(), logInfo: jest.fn() }))

import { verifyPaddleWebhookSignature, mapPaddleSubscriptionStatus } from '@/lib/paddle'
import { SubscriptionStatus } from '@prisma/client'
import { POST } from '@/app/api/webhooks/paddle/route'

/** Sign a raw body the way Paddle does, producing a `ts=...;h1=...` header. */
function sign(rawBody: string, secret = TEST_SECRET, ts = Math.floor(Date.now() / 1000)): string {
  const h1 = createHmac('sha256', secret).update(`${ts}:${rawBody}`).digest('hex')
  return `ts=${ts};h1=${h1}`
}

function makeReq(rawBody: string, sig: string | null): import('next/server').NextRequest {
  return {
    text: async () => rawBody,
    headers: { get: (k: string) => (k.toLowerCase() === 'paddle-signature' ? sig : null) },
  } as unknown as import('next/server').NextRequest
}

function event(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    event_id: 'evt_1',
    event_type: 'subscription.activated',
    data: {
      id: 'sub_123',
      customer_id: 'ctm_123',
      status: 'active',
      current_billing_period: { starts_at: '2026-07-04T00:00:00Z', ends_at: '2027-07-04T00:00:00Z' },
      scheduled_change: null,
      custom_data: { userId: 'student1' },
      ...overrides,
    },
  })
}

beforeEach(() => userUpdateMany.mockClear())

describe('verifyPaddleWebhookSignature', () => {
  const body = '{"event_type":"subscription.activated"}'

  it('accepts a correctly signed body', () => {
    expect(verifyPaddleWebhookSignature(body, sign(body))).toBe(true)
  })
  it('rejects a tampered body', () => {
    const header = sign(body)
    expect(verifyPaddleWebhookSignature(body + ' ', header)).toBe(false)
  })
  it('rejects a tampered signature', () => {
    const header = sign(body).replace(/h1=.*/, 'h1=deadbeef')
    expect(verifyPaddleWebhookSignature(body, header)).toBe(false)
  })
  it('rejects a signature made with the wrong secret', () => {
    expect(verifyPaddleWebhookSignature(body, sign(body, 'wrong_secret'))).toBe(false)
  })
  it('returns false (no throw) on a malformed header', () => {
    expect(verifyPaddleWebhookSignature(body, 'garbage')).toBe(false)
    expect(verifyPaddleWebhookSignature(body, null)).toBe(false)
  })
})

describe('mapPaddleSubscriptionStatus', () => {
  it('maps Paddle statuses to our enum', () => {
    expect(mapPaddleSubscriptionStatus('active')).toBe(SubscriptionStatus.ACTIVE)
    expect(mapPaddleSubscriptionStatus('trialing')).toBe(SubscriptionStatus.ACTIVE)
    expect(mapPaddleSubscriptionStatus('past_due')).toBe(SubscriptionStatus.PAST_DUE)
    expect(mapPaddleSubscriptionStatus('paused')).toBe(SubscriptionStatus.CANCELED)
    expect(mapPaddleSubscriptionStatus('canceled')).toBe(SubscriptionStatus.CANCELED)
    expect(mapPaddleSubscriptionStatus('anything_else')).toBe(SubscriptionStatus.NONE)
  })
})

describe('POST /api/webhooks/paddle', () => {
  it('rejects an invalid signature with 401 and writes nothing', async () => {
    const body = event({})
    const res = await POST(makeReq(body, 'ts=1;h1=bad'))
    expect(res.status).toBe(401)
    expect(userUpdateMany).not.toHaveBeenCalled()
  })

  it('activates the subscription on subscription.activated', async () => {
    const body = event({})
    const res = await POST(makeReq(body, sign(body)))
    expect(res.status).toBe(200)
    expect(userUpdateMany).toHaveBeenCalledTimes(1)
    const arg = userUpdateMany.mock.calls[0][0]
    expect(arg.where).toEqual({ id: 'student1' })
    expect(arg.data.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE)
    expect(arg.data.paddleSubscriptionId).toBe('sub_123')
    expect(arg.data.paddleCustomerId).toBe('ctm_123')
    expect(arg.data.subscriptionCurrentPeriodEnd).toBeInstanceOf(Date)
    expect(arg.data.subscriptionCancelAtPeriodEnd).toBe(false)
  })

  it('flags cancel-at-period-end when a scheduled change is present', async () => {
    const body = event({ scheduled_change: { action: 'cancel', effective_at: '2027-07-04T00:00:00Z' } })
    await POST(makeReq(body, sign(body)))
    expect(userUpdateMany.mock.calls[0][0].data.subscriptionCancelAtPeriodEnd).toBe(true)
  })

  it('on subscription.canceled, matches BOTH userId and the subscription id (resubscribe guard)', async () => {
    const canceled = JSON.stringify({
      event_id: 'evt_2',
      event_type: 'subscription.canceled',
      data: { id: 'sub_OLD', customer_id: 'ctm_123', status: 'canceled', custom_data: { userId: 'student1' } },
    })
    const res = await POST(makeReq(canceled, sign(canceled)))
    expect(res.status).toBe(200)
    const arg = userUpdateMany.mock.calls[0][0]
    // The guard: only cancels if this user's stored subscription IS sub_OLD.
    expect(arg.where).toEqual({ id: 'student1', paddleSubscriptionId: 'sub_OLD' })
    expect(arg.data.subscriptionStatus).toBe('CANCELED')
    expect(arg.data.subscriptionCancelAtPeriodEnd).toBe(false)
  })

  it('ignores events missing custom_data.userId without writing', async () => {
    const body = event({ custom_data: null })
    const res = await POST(makeReq(body, sign(body)))
    expect(res.status).toBe(200)
    expect(userUpdateMany).not.toHaveBeenCalled()
  })

  it('ignores non-subscription events without writing', async () => {
    const body = JSON.stringify({ event_id: 'evt_3', event_type: 'transaction.completed', data: { id: 'txn_1' } })
    const res = await POST(makeReq(body, sign(body)))
    expect(res.status).toBe(200)
    expect(userUpdateMany).not.toHaveBeenCalled()
  })
})
