import { NextRequest, NextResponse } from 'next/server'
import { persist } from '@/lib/logger'

// Browser CSP violation reports, from the Content-Security-Policy-Report-Only header set in
// next.config.js. During the observation week these are the whole point: every row is either
// an origin the policy forgot, or evidence the policy is right to block something.
//
// Unauthenticated on purpose (browsers post these without credentials on any page, signed in
// or not), and deliberately boring to abuse, same shape as /api/client-error: per-IP token
// bucket, tiny payload caps, always 204 — a broken reporter must never make a page worse.

const bucket = new Map<string, { n: number; reset: number }>()

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const b = bucket.get(ip)
    if (b && now < b.reset) {
      if (b.n >= 10) return new NextResponse(null, { status: 204 })
      b.n++
    } else {
      bucket.set(ip, { n: 1, reset: now + 60_000 })
      if (bucket.size > 5000) bucket.clear()
    }

    const raw = await req.text()
    if (!raw || raw.length > 20_000) return new NextResponse(null, { status: 204 })
    const body = JSON.parse(raw) as Record<string, unknown>

    // Two wire formats: legacy report-uri posts {"csp-report": {...}}; the Reporting API
    // posts an array of {type:"csp-violation", body:{...}}. Normalize to one row each.
    const reports: Record<string, unknown>[] = Array.isArray(body)
      ? body.map(r => (r as { body?: Record<string, unknown> }).body ?? {})
      : [(body['csp-report'] as Record<string, unknown>) ?? body]

    for (const r of reports.slice(0, 5)) {
      const directive = String(r['effective-directive'] ?? r['effectiveDirective'] ?? r['violated-directive'] ?? '?').slice(0, 100)
      const blocked = String(r['blocked-uri'] ?? r['blockedURL'] ?? '?').slice(0, 300)
      const page = String(r['document-uri'] ?? r['documentURL'] ?? '').slice(0, 300)
      // persist() de-duplicates on scope+message for a minute, so one bad origin on a busy
      // page reads as one row per minute, not one per student.
      await persist('client', 'csp-report',
        { message: `${directive} blocked ${blocked}` },
        { directive, blocked, page },
        { url: page, ua: req.headers.get('user-agent') ?? undefined })
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
