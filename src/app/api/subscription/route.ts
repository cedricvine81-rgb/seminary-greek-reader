import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { logError } from '@/lib/logger'

// GET /api/subscription — the current student's subscription state. Used by the
// /subscribe page (to poll for the webhook landing after checkout) and by the
// Settings page's "Manage subscription" panel.
export async function GET() {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
        subscriptionCancelAtPeriodEnd: true,
      },
    })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
    })
  } catch (err) {
    logError('api/subscription', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
