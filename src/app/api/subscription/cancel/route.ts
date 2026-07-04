import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { paddleCancelSubscription } from '@/lib/paddle'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

// POST /api/subscription/cancel — schedules cancellation at the end of the current
// billing period. No refund is issued for time already paid; access continues until
// subscriptionCurrentPeriodEnd. Does not write subscription state itself — the Paddle
// webhook is the sole writer, this only calls Paddle and reports its response back so
// the UI can show the effective date immediately instead of waiting on the webhook.
export async function POST() {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = rateLimit(`subscription-cancel:${payload.sub}`, 5, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Please wait a moment and try again.' }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { subscriptionStatus: true, paddleSubscriptionId: true },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (user.subscriptionStatus !== 'ACTIVE' || !user.paddleSubscriptionId) {
      return NextResponse.json({ error: 'You do not have an active subscription to cancel.' }, { status: 400 })
    }

    const result = await paddleCancelSubscription(user.paddleSubscriptionId)
    const effectiveAt = result?.data?.scheduled_change?.effective_at ?? null

    return NextResponse.json({ ok: true, effectiveAt })
  } catch (err) {
    logError('api/subscription/cancel', err)
    return NextResponse.json({ error: 'Could not cancel your subscription. Please try again.' }, { status: 500 })
  }
}
