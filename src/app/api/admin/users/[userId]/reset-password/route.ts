import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken, hashPassword } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail, emailConfigured } from '@/lib/email'
import {
  CREDENTIALS_SUBJECT, credentialsText, credentialsHtml, type Credentials,
} from '@/lib/credentials-email'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

/**
 * Generate a human-friendly temporary password.
 * 12 characters from a deliberately limited alphabet (no 0/O/1/l/I) so the
 * password is easy to read in an email and to type without ambiguity.
 */
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  // crypto.getRandomValues is available in Node 19+ (Vercel uses 20+)
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  bytes.forEach(b => { out += alphabet[b % alphabet.length] })
  return out
}

/**
 * POST /api/admin/users/[userId]/reset-password
 *
 * Admin-only. Resets the user's password to a fresh random value, sets the
 * `mustChangePassword` flag so the user is forced to change it on first sign-in, EMAILS the
 * details to the user, and returns the plaintext temp password ONCE. The plaintext is never
 * stored or logged.
 *
 * The email is sent from here rather than handed to the admin's own mail client, which is what
 * this did before: the browser opened a `mailto:` draft, and when the admin's mail client could
 * not send it the reset had already happened — leaving a student locked out of an account whose
 * temporary password no longer existed anywhere. Sending here means the app knows whether the
 * message left the building, and can say so.
 *
 * The response still carries the plaintext for exactly that reason: if the send fails, or mail
 * is not configured, the admin must be able to read the password off the screen and pass it on
 * some other way. It is the only copy that will ever exist.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Daily budget: at most 100 password resets per admin in 24h. Generous enough to
    // onboard a full class in one sitting, while still stopping a runaway loop or script.
    const rl = rateLimit(`admin-pwd-reset:${admin.sub}`, 100, 24 * 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Daily password-reset limit reached. Try again in a few hours.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    // Don't reset another admin's password without going through the normal change flow
    const target = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, email: true, role: true, deletedAt: true, firstName: true, surname: true },
    })
    if (!target || target.deletedAt) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (target.role === 'ADMIN' && target.id !== admin.sub) {
      return NextResponse.json({ error: 'Cannot reset another admin’s password from this endpoint.' }, { status: 403 })
    }

    const tempPassword = generateTempPassword()
    const hashed = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id: target.id },
      data: { password: hashed, mustChangePassword: true },
    })

    // An absolute URL always: a relative one is unusable in an email, and the fallback keeps
    // the message correct on a deployment where NEXT_PUBLIC_APP_URL was never set.
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://seminarygreek.app'
    const credentials: Credentials = {
      name: target.firstName,
      email: target.email,
      tempPassword,
      signInUrl: `${base}/auth/sign-in`,
    }
    // Sent AFTER the password is changed, never before: an email quoting a password that a
    // failed update never applied would be worse than no email at all.
    const { sent } = await sendEmail({
      to: [target.email],
      subject: CREDENTIALS_SUBJECT,
      html: credentialsHtml(credentials),
      text: credentialsText(credentials),
    })

    await recordAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: 'user.passwordReset',
      targetType: 'User',
      targetId: target.id,
      // Never log the plaintext password — just the fact that it happened
      before: { email: target.email, role: target.role },
      // Whether the message actually left is part of what happened, and the one fact an admin
      // will want months later when a student says they never got it.
      after: { mustChangePassword: true, emailSent: sent },
    })

    // Plaintext returned only in this response. The admin's UI uses it once to
    // pre-fill an email; it is not stored anywhere on disk or in logs.
    return NextResponse.json({
      ok: true,
      tempPassword,
      emailSent: sent,
      // Handed back so the admin's "copy whole message" quotes the same address this email
      // did — the two used to disagree, one hard-coded and one configured.
      signInUrl: credentials.signInUrl,
      // Distinguishes "mail is switched off here" from "mail is on and this send failed" — the
      // admin's next move differs.
      emailConfigured: emailConfigured(),
      user: {
        email: target.email,
        firstName: target.firstName,
        surname: target.surname,
      },
    })
  } catch (err) {
    logError('api/admin/users/[userId]/reset-password', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
