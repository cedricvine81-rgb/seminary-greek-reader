import { NextResponse } from 'next/server'
import { prisma } from './db'
import { SubscriptionStatus } from '@prisma/client'
import type { JWTPayload } from '@/types/auth'

const ACCESS_STATUSES: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRANDFATHERED]

/** Returns true if the student may access paywalled student pages/actions. */
export async function studentHasAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  })
  return !!user && ACCESS_STATUSES.includes(user.subscriptionStatus)
}

/**
 * API-route paywall gate. Enforces the subscription at the data layer so a blocked
 * student can't bypass the UI-level redirect (DashboardShell) by calling endpoints
 * directly. Only STUDENT is paywalled — instructors/admins pass, and an instructor
 * previewing student pages carries their real INSTRUCTOR role in the JWT.
 *
 * Returns a NextResponse to short-circuit the handler when access is denied, or null
 * to continue. Call right after the handler's existing `getPayload()` null-check:
 *
 *   const gate = await requireStudentAccess(payload)
 *   if (gate) return gate
 */
export async function requireStudentAccess(payload: JWTPayload | null): Promise<NextResponse | null> {
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (payload.role !== 'STUDENT') return null
  if (await studentHasAccess(payload.sub)) return null
  // 402 Payment Required — the client can distinguish this from a 401/403 and route to /subscribe.
  return NextResponse.json({ error: 'subscription_required' }, { status: 402 })
}
