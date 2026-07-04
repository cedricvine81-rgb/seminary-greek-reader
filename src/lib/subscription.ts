import { prisma } from './db'
import { SubscriptionStatus } from '@prisma/client'

const ACCESS_STATUSES: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRANDFATHERED]

/** Returns true if the student may access paywalled student pages/actions. */
export async function studentHasAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  })
  return !!user && ACCESS_STATUSES.includes(user.subscriptionStatus)
}
