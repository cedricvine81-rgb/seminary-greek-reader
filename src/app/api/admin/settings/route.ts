import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getAppSettings, updateAppSettings } from '@/lib/app-settings'
import { logError } from '@/lib/logger'

// Reads/writes live DB; never pre-render.
export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// A lax-but-sane email check — good enough to catch typos without rejecting valid
// addresses. Empty string is allowed (it clears the field).
function normalizeEmail(v: unknown): { ok: true; value: string | null } | { ok: false } {
  if (v == null) return { ok: true, value: null }
  if (typeof v !== 'string') return { ok: false }
  const trimmed = v.trim()
  if (trimmed === '') return { ok: true, value: null }
  if (trimmed.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { ok: false }
  return { ok: true, value: trimmed }
}

// GET /api/admin/settings — current new-instructor notification addresses.
export async function GET() {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const s = await getAppSettings()
    return NextResponse.json({
      instructorNotifyEmail: s?.instructorNotifyEmail ?? '',
      instructorNotifyEmail2: s?.instructorNotifyEmail2 ?? '',
    })
  } catch (err) {
    logError('GET /api/admin/settings', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// PATCH /api/admin/settings — update either/both notification addresses.
export async function PATCH(req: NextRequest) {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()

    const primary = normalizeEmail(body.instructorNotifyEmail)
    const second = normalizeEmail(body.instructorNotifyEmail2)
    if (!primary.ok || !second.ok) {
      return NextResponse.json({ error: 'Please enter valid email addresses (or leave a field blank).' }, { status: 400 })
    }

    const s = await updateAppSettings({
      instructorNotifyEmail: primary.value,
      instructorNotifyEmail2: second.value,
    })
    return NextResponse.json({
      instructorNotifyEmail: s.instructorNotifyEmail ?? '',
      instructorNotifyEmail2: s.instructorNotifyEmail2 ?? '',
    })
  } catch (err) {
    logError('PATCH /api/admin/settings', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
