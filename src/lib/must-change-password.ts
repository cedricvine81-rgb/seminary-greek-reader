import { prisma } from './db'

/**
 * Returns true if the given user has been flagged to set their own password
 * before they can use the app (e.g. admin-created accounts with a temp password).
 *
 * Use this in server-component page guards. Pair with a redirect to
 * `/auth/change-password` when true.
 */
export async function userMustChangePassword(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  })
  return !!user?.mustChangePassword
}
