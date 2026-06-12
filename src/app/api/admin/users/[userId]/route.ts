import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken, hashPassword } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// Sensitive fields whose changes are worth recording in the audit log
const SENSITIVE_FIELDS = ['email', 'role', 'approved', 'password'] as const

// PATCH /api/admin/users/[userId] — edit user fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { firstName, surname, email, role, institution, password, approved, restore } = body

    // Snapshot before, so the audit log can show the change
    const before = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, email: true, role: true, approved: true, firstName: true, surname: true, institution: true, deletedAt: true },
    })
    if (!before) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Restore branch — explicit { restore: true } clears the soft-delete marker.
    // Handled separately so it can't be mixed with other field changes by accident.
    if (restore === true) {
      if (!before.deletedAt) {
        return NextResponse.json({ ok: true, alreadyActive: true })
      }
      await prisma.user.update({
        where: { id: params.userId },
        data: { deletedAt: null },
      })
      await recordAudit({
        actorId: admin.sub,
        actorEmail: admin.email,
        action: 'user.restore',
        targetType: 'User',
        targetId: params.userId,
        before: { email: before.email, role: before.role, deletedAt: before.deletedAt },
        after: { deletedAt: null },
      })
      return NextResponse.json({ ok: true })
    }

    const data: Record<string, unknown> = {}
    if (firstName !== undefined) data.firstName = firstName
    if (surname !== undefined) data.surname = surname
    if (email !== undefined) data.email = email
    if (role !== undefined) data.role = role
    if (institution !== undefined) data.institution = institution || null
    if (approved !== undefined) data.approved = Boolean(approved)
    if (password) data.password = await hashPassword(password)

    const user = await prisma.user.update({ where: { id: params.userId }, data })

    // Audit only sensitive changes (skip mere typo fixes)
    const changedSensitive = SENSITIVE_FIELDS.some(f =>
      f === 'password' ? !!password : (data as Record<string, unknown>)[f] !== undefined &&
        (data as Record<string, unknown>)[f] !== (before as unknown as Record<string, unknown>)[f]
    )
    if (changedSensitive) {
      // Don't store password values in the log — just a marker
      const sanitizedAfter: Record<string, unknown> = { ...data }
      if ('password' in sanitizedAfter) sanitizedAfter.password = '[changed]'
      await recordAudit({
        actorId: admin.sub,
        actorEmail: admin.email,
        action: 'user.update',
        targetType: 'User',
        targetId: params.userId,
        before: { email: before.email, role: before.role, approved: before.approved },
        after: sanitizedAfter,
      })
    }

    return NextResponse.json({ user })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2002') return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
    if (code === 'P2025') return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    logError('api/admin/users/[userId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[userId]
// Soft-delete: sets `deletedAt`. Reversible by clearing the column. Never physically drops the row.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (params.userId === admin.sub) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    // Daily delete budget per admin — catches bulk-delete mistakes (5 / day).
    // Uses the in-memory rate limiter; resets on serverless cold-starts, but is plenty
    // tight to catch accidental loops or scripts gone wrong.
    const rl = rateLimit(`admin-user-delete:${admin.sub}`, 5, 24 * 60 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Daily user-deletion limit reached. Contact support if you need to delete more accounts in a 24-hour window.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const existing = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, email: true, role: true, firstName: true, surname: true, deletedAt: true },
    })
    if (!existing) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (existing.deletedAt) return NextResponse.json({ ok: true, alreadyDeleted: true })

    // Soft delete: mark deletedAt, keep the row and all related data intact
    await prisma.user.update({
      where: { id: params.userId },
      data: { deletedAt: new Date() },
    })

    await recordAudit({
      actorId: admin.sub,
      actorEmail: admin.email,
      action: 'user.softDelete',
      targetType: 'User',
      targetId: params.userId,
      before: { email: existing.email, role: existing.role, firstName: existing.firstName, surname: existing.surname },
      after: { deletedAt: new Date().toISOString() },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2025') return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    logError('api/admin/users/[userId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
