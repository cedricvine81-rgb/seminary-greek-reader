import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, signToken, setAuthCookie, clearAuthCookie, getTokenFromCookies, verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail, escapeHtml, emailConfigured } from '@/lib/email'
import { createHash, randomBytes } from 'node:crypto'
import { instructorNotifyRecipients } from '@/lib/app-settings'
import { logError } from '@/lib/logger'
import type { Role } from '@/types/auth'

// Bump whenever /terms is materially revised, so we know whose consent is stale.
const TERMS_VERSION = '2026-07'

/** Best-effort client IP for rate-limiting (Vercel sets x-forwarded-for). */
function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/** The stored form of a reset token. The plaintext only ever exists in the emailed link. */
const hashResetToken = (raw: string) => createHash('sha256').update(raw).digest('hex')

const RESET_TTL_MS = 60 * 60 * 1000 // one hour

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body
    const ip = clientIp(req)

    if (action === 'signup') {
      const { firstName, surname, email, password, institution, role, personalEmail, messagingConsent, terms } = body

      // Throttle account creation per IP to prevent spam registration
      const rl = rateLimit(`signup:${ip}`, 5, 3_600_000)
      if (!rl.ok) {
        return NextResponse.json(
          { error: 'Too many sign-up attempts. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
        )
      }

      if (!firstName || !surname || !email || !password || !role) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
      }

      // Enforce a minimum password strength (mirrors the change-password rule)
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
      }

      // ADMIN accounts can only be created by an existing admin — never via self-registration
      if (role === 'ADMIN') {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
      }

      // Students must provide a personal (non-institutional) contact email, distinct
      // from their login email, and accept the Terms of Service.
      if (role === 'STUDENT') {
        if (!personalEmail || typeof personalEmail !== 'string') {
          return NextResponse.json({ error: 'A personal email address is required.' }, { status: 400 })
        }
        if (personalEmail.trim().toLowerCase() === String(email).trim().toLowerCase()) {
          return NextResponse.json({ error: 'Personal email must differ from your institutional email.' }, { status: 400 })
        }
      }
      if (!terms) {
        return NextResponse.json({ error: 'You must accept the Terms of Service to continue.' }, { status: 400 })
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })

      // Instructors must be approved by an admin before they can sign in.
      const isInstructor = role === 'INSTRUCTOR'
      const hashed = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          firstName, surname, email, password: hashed,
          role: role as Role, institution,
          approved: !isInstructor, // students auto-approved; instructors pending
          personalEmail: role === 'STUDENT' ? personalEmail.trim() : undefined,
          messagingConsent: role === 'STUDENT' ? !!messagingConsent : undefined,
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
        },
      })

      // Pending instructors get no session — they see a "awaiting approval" message.
      if (isInstructor) {
        // Notify the admin(s) that an instructor is awaiting approval. Best-effort:
        // sendEmail never throws and no-ops until email is configured, but we still
        // guard the whole block so a notification hiccup can't fail account creation.
        try {
          const recipients = await instructorNotifyRecipients()
          if (recipients.length > 0) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
            const inst = institution ? String(institution) : '—'
            await sendEmail({
              to: recipients,
              subject: `New instructor awaiting approval: ${firstName} ${surname}`,
              html: `<p>A new instructor account has been created and is awaiting your approval.</p>
<ul>
  <li><strong>Name:</strong> ${escapeHtml(String(firstName))} ${escapeHtml(String(surname))}</li>
  <li><strong>Email:</strong> ${escapeHtml(String(email))}</li>
  <li><strong>Institution:</strong> ${escapeHtml(inst)}</li>
</ul>
<p><a href="${appUrl}/admin/users">Review and approve in the admin panel</a></p>`,
              text: `A new instructor account is awaiting your approval.\n\nName: ${firstName} ${surname}\nEmail: ${email}\nInstitution: ${inst}\n\nReview and approve: ${appUrl}/admin/users`,
            })
          }
        } catch (err) {
          logError('POST /api/auth instructor-signup notify', err)
        }

        return NextResponse.json({
          pending: true,
          message: 'Your instructor account has been created and is awaiting admin approval. You will be able to sign in once approved.',
        }, { status: 201 })
      }

      const token = signToken({ sub: user.id, email: user.email, role: user.role as Role })
      setAuthCookie(token)
      // A fresh sign-in starts a fresh session: drop any instructor-preview flag left by a
      // previous account in this browser, so a student never inherits preview mode.
      cookies().delete('instructor_preview')
      return NextResponse.json({ user: { id: user.id, email, role: user.role }, token })
    }

    // ── Self-service password reset ─────────────────────────────────────────────
    //
    // Two actions. `request-password-reset` never reveals whether an address is registered:
    // it answers the same way for a real account, an unknown one, and a rate-limited caller,
    // because a reset form that says "no such user" is an account-enumeration oracle.
    //
    // It DOES fail loudly when email is unconfigured. That is not enumeration — it is a fact
    // about this deployment, and a student who is told "check your inbox" for a message that
    // can never be sent is worse off than one told to contact their instructor.
    if (action === 'request-password-reset') {
      const { email } = body
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
      }
      if (!emailConfigured()) {
        return NextResponse.json({ error: 'email_not_configured' }, { status: 503 })
      }

      const addr = email.trim().toLowerCase()
      // Two limits: one stops a scan across many addresses, one stops mailbox-flooding a
      // single victim. Both answer 200 so neither can be used to probe.
      const ipRl = rateLimit(`reset-ip:${ip}`, 10, 3_600_000)
      const emailRl = rateLimit(`reset-email:${addr}`, 4, 3_600_000)

      if (ipRl.ok && emailRl.ok) {
        const user = await prisma.user.findUnique({
          where: { email: addr },
          select: { id: true, firstName: true, deletedAt: true },
        })
        if (user && !user.deletedAt) {
          const raw = randomBytes(32).toString('base64url')
          await prisma.passwordResetToken.create({
            data: {
              userId: user.id,
              tokenHash: hashResetToken(raw),
              expiresAt: new Date(Date.now() + RESET_TTL_MS),
            },
          })
          const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
          const link = `${base}/auth/reset-password?token=${raw}`
          await sendEmail({
            to: [addr],
            subject: 'Reset your Seminary Greek password',
            html: `<p>Hello ${escapeHtml(user.firstName)},</p>`
              + `<p>Someone asked to reset the password for this account. `
              + `The link below works once and expires in one hour:</p>`
              + `<p><a href="${escapeHtml(link)}">Choose a new password</a></p>`
              + `<p>If that was not you, you can ignore this message — `
              + `your password has not changed.</p>`,
            text: `Hello ${user.firstName},\n\n`
              + `Someone asked to reset the password for this account. The link below works `
              + `once and expires in one hour:\n\n${link}\n\n`
              + `If that was not you, you can ignore this message - your password has not changed.\n`,
          })
        }
      }
      // Same answer either way.
      return NextResponse.json({ ok: true })
    }

    if (action === 'reset-password') {
      const { token, password } = body
      if (!token || typeof token !== 'string') {
        return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
      }
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
      }
      // Guessing a 32-byte token is not realistic, but the limit also caps the damage from a
      // leaked link being hammered.
      const rl = rateLimit(`reset-submit:${ip}`, 20, 3_600_000)
      if (!rl.ok) {
        return NextResponse.json({ error: 'Too many attempts. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
      }

      const row = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashResetToken(token) },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      })
      if (!row || row.usedAt || row.expiresAt < new Date()) {
        return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
      }

      const hashed = await hashPassword(password)
      // One transaction: set the password, spend this ticket, and spend every other
      // outstanding ticket for the same user, so an older forwarded email stops working.
      await prisma.$transaction([
        prisma.user.update({
          where: { id: row.userId },
          data: { password: hashed, mustChangePassword: false },
        }),
        prisma.passwordResetToken.updateMany({
          where: { userId: row.userId, usedAt: null },
          data: { usedAt: new Date() },
        }),
      ])
      return NextResponse.json({ ok: true })
    }

    if (action === 'signin') {
      const { email, password } = body
      if (!email || !password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })

      // Brute-force protection: cap attempts per IP and per targeted email.
      const ipRl = rateLimit(`signin-ip:${ip}`, 20, 300_000)        // 20 / 5 min per IP
      const emailRl = rateLimit(`signin-email:${String(email).toLowerCase()}`, 8, 300_000) // 8 / 5 min per account
      if (!ipRl.ok || !emailRl.ok) {
        const retryAfter = Math.max(ipRl.retryAfter, emailRl.retryAfter)
        return NextResponse.json(
          { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        )
      }

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
      // Soft-deleted accounts cannot sign in (kept opaque so we don't leak account existence)
      if (user.deletedAt) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })

      const valid = await verifyPassword(password, user.password)
      if (!valid) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })

      // Block instructors who haven't yet been approved by an admin.
      if (user.role === 'INSTRUCTOR' && !user.approved) {
        return NextResponse.json(
          { error: 'Your instructor account is awaiting admin approval.' },
          { status: 403 },
        )
      }

      const token = signToken({ sub: user.id, email: user.email, role: user.role as Role })
      setAuthCookie(token)
      // A fresh sign-in starts a fresh session: drop any instructor-preview flag left by a
      // previous account in this browser, so a student never inherits preview mode.
      cookies().delete('instructor_preview')
      return NextResponse.json({
        user: { id: user.id, email, role: user.role },
        token,
        role: user.role,
        // Tell the client to detour through a forced password-change screen on first sign-in
        mustChangePassword: user.mustChangePassword,
      })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auth] sign-in error:', message)
    const detail = process.env.NODE_ENV !== 'production' ? message : undefined
    return NextResponse.json({ error: 'Server error.', detail }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { password } = await req.json()
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const hashed = await hashPassword(password)
    // Also clear the "must change password" flag — once the user has set their own,
    // they no longer need to be redirected to the forced-change screen.
    await prisma.user.update({
      where: { id: payload.sub },
      data: { password: hashed, mustChangePassword: false },
    })
    // Return the role so the client can land the user on the right dashboard
    // (the forced-change flow redirects by role rather than to the Reader at "/").
    return NextResponse.json({ ok: true, role: payload.role })
  } catch (err) {
    console.error('[auth] password change error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE() {
  clearAuthCookie()
  return NextResponse.json({ ok: true })
}
