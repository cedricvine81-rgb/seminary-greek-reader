import { NextRequest, NextResponse } from 'next/server'
import { TRACK_COOKIE, isTrack } from '@/lib/track'

// ── Hebrew front door ─────────────────────────────────────────────────────────
// seminaryhebrew.app exists so nobody else takes the name, and so the Hebrew course can be
// advertised at its own address. It is REDIRECTED here, never served.
//
// Redirected rather than served on purpose: keeping one origin means Paddle still sees a
// single approved domain, one product and one webhook, and checkout never runs anywhere it
// has not been approved. Because this fires before anything renders, no page — and no
// Paddle.js — is ever served from the Hebrew host.
//
// 307, deliberately NOT 308/301. Browsers cache permanent redirects hard and for a long
// time, so a permanent one here would quietly make a reversible decision irreversible: if
// the Hebrew domain is ever served directly, every visitor who saw the 308 would keep being
// bounced away and no cache could be cleared. When that day comes, replace this block with
// one that seeds the track cookie from the hostname instead.
const HEBREW_HOSTS = new Set(['seminaryhebrew.app', 'www.seminaryhebrew.app'])
const CANONICAL_ORIGIN = 'https://seminarygreek.app'

// Routes that are always public (no auth required)
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/reader',
  '/api/translation',
  '/api/search',
  '/api/lexicon',
  '/api/suggest',
  '/api/construct', // Construct search's lexeme lookup — public read-only corpus data, like /api/suggest
  '/api/allusions', // Allusion search over the LXX (Exegesis → Allusions) — public read-only corpus data
  '/api/vocab-sentence', // "Identify the word" drill — public read-only Bible text, like /api/reader
  '/api/preview',
  '/api/profile/institutions', // institution list for the sign-up dropdown (public, non-sensitive)
  '/api/client-error', // browser error reports — errors happen signed out too; rate-limited in the route
  '/api/webhooks/paddle', // Paddle calls this with no session cookie — trust is via HMAC signature instead
]

// Routes that require ADMIN role
const ADMIN_PREFIXES = ['/api/admin', '/admin']

// Routes that require INSTRUCTOR role
const INSTRUCTOR_PREFIXES = [
  '/api/gradebook',
  '/api/reports',
  // Managing the materials library is instructor-only. NB: /api/materials/download
  // is intentionally omitted so students can fetch files shared with their courses
  // (that route runs its own per-file access check).
  '/api/materials/list',
  '/api/materials/folders',
  '/api/materials/files',
  '/api/materials/upload-url',
  '/api/materials/share',
  '/instructor',
]

/** Decode a JWT without verifying signature — safe for middleware role-checks
 *  because the signature is still verified server-side in each API handler. */
function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(payload)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Arriving at the Hebrew domain: bounce to the canonical one, keeping the path and any
  // query, and asking for the Hebrew track. The handler below turns that into the cookie.
  const host = (req.headers.get('host') ?? req.nextUrl.host).toLowerCase().split(':')[0]
  if (HEBREW_HOSTS.has(host)) {
    const url = new URL(pathname + req.nextUrl.search, CANONICAL_ORIGIN)
    url.searchParams.set('track', 'hebrew')
    return NextResponse.redirect(url, 307)
  }

  // ── Language track entry point ──────────────────────────────────────────────
  // seminaryhebrew.app redirects here as /?track=hebrew. Turn the parameter into the
  // cookie the rest of the app reads, then strip it so the address bar stays clean and
  // the parameter cannot be re-applied by a back-navigation or a shared link.
  //
  // When the Hebrew domain is eventually served directly rather than redirected, seed the
  // same cookie from req.nextUrl.hostname here instead; nothing downstream changes.
  const trackParam = req.nextUrl.searchParams.get('track')
  if (isTrack(trackParam)) {
    // Set the cookie and RENDER — no redirect. Bouncing to strip the parameter cost a third
    // round trip on top of the cross-origin hop from the Hebrew domain, which is why arriving
    // at seminaryhebrew.app/<page> felt slow next to the same page on seminarygreek.app:
    //     hebrew host → 307 → ?track=hebrew → 307 → page      (three trips, two hosts)
    //     canonical host                    → page            (one)
    // Mutating req.cookies first means the server components on THIS request already read the
    // new track, so the first paint is correct; the parameter is then removed from the address
    // bar client-side (TrackParamCleanup) rather than by another trip to the server.
    req.cookies.set(TRACK_COOKIE, trackParam)
    const res = NextResponse.next({ request: { headers: req.headers } })
    res.cookies.set(TRACK_COOKIE, trackParam, {
      path: '/', maxAge: 31536000, sameSite: 'lax',
    })
    return res
  }

  // Always allow public routes
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Only enforce on /api/* and /admin/* and /instructor/* routes
  const isApi = pathname.startsWith('/api/')
  const isAdminPath = ADMIN_PREFIXES.some(p => pathname.startsWith(p))
  const isInstructorPath = INSTRUCTOR_PREFIXES.some(p => pathname.startsWith(p))

  if (!isApi && !isAdminPath && !isInstructorPath) {
    return NextResponse.next()
  }

  const token = req.cookies.get('sg_token')?.value ?? null
  const payload = token ? decodeJwtPayload(token) : null

  // Must be authenticated
  if (!payload) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  // Admin routes require ADMIN role
  if (isAdminPath && payload.role !== 'ADMIN') {
    if (isApi) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  // Instructor routes require INSTRUCTOR or ADMIN role
  if (isInstructorPath && payload.role !== 'INSTRUCTOR' && payload.role !== 'ADMIN') {
    if (isApi) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    // Page routes too, so ?track= is caught wherever someone lands — not just on the
    // three protected prefixes above. The role checks skip anything that is not an
    // /api, /admin or /instructor path, so this only adds the track handling.
    // Excludes Next's internals and any path with a file extension (static assets).
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)',
  ],
}
