import { NextRequest, NextResponse } from 'next/server'
import { persist } from '@/lib/logger'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// Browser errors, reported by ClientErrorReporter in the root layout.
//
// Unauthenticated on purpose — errors happen signed out too, and this endpoint must never
// be a reason a broken page gets more broken. The flip side is that it is an open write
// endpoint, so it is deliberately boring to abuse: tiny payload caps, a per-IP token
// bucket, and rows that carry only what a stack trace needs. The reporter also caps
// itself at 5 reports per page load, so even a crash loop is a trickle.

const bucket = new Map<string, { n: number; reset: number }>()

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const b = bucket.get(ip)
    if (b && now < b.reset) {
      if (b.n >= 10) return NextResponse.json({ ok: true })   // silently drop; never error
      b.n++
    } else {
      bucket.set(ip, { n: 1, reset: now + 60_000 })
      if (bucket.size > 5000) bucket.clear()
    }

    const body = await req.json().catch(() => null) as
      { message?: string; stack?: string; url?: string; scope?: string; digest?: string } | null
    if (!body?.message) return NextResponse.json({ ok: true })

    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null

    // The digest is how a server render error is matched to the hosting platform's log,
    // where its actual message lives — keep it with the row.
    await persist('client', (body.scope ?? 'window.onerror').slice(0, 200),
      { message: body.message, stack: body.stack },
      body.digest ? { digest: String(body.digest).slice(0, 100) } : undefined, {
        url: body.url,
        ua: req.headers.get('user-agent') ?? undefined,
        userId: payload?.sub,
      })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
