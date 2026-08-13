import { NextRequest, NextResponse } from 'next/server'
import { TRACK_COOKIE, isTrack } from '@/lib/track'

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

  // ── Language track entry point ──────────────────────────────────────────────
  // seminaryhebrew.app redirects here as /?track=hebrew. Turn the parameter into the
  // cookie the rest of the app reads, then strip it so the address bar stays clean and
  // the parameter cannot be re-applied by a back-navigation or a shared link.
  //
  // When the Hebrew domain is eventually served directly rather than redirected, seed the
  // same cookie from req.nextUrl.hostname here instead; nothing downstream changes.
  const trackParam = req.nextUrl.searchParams.get('track')
  if (isTrack(trackParam)) {
    const url = req.nextUrl.clone()
    url.searchParams.delete('track')
    const res = NextResponse.redirect(url)
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
