import { NextRequest, NextResponse } from 'next/server'

// Routes that are always public (no auth required)
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/reader',
  '/api/translation',
  '/api/search',
  '/api/preview',
  '/api/profile/institutions', // institution list for the sign-up dropdown (public, non-sensitive)
]

// Routes that require ADMIN role
const ADMIN_PREFIXES = ['/api/admin', '/admin']

// Routes that require INSTRUCTOR role
const INSTRUCTOR_PREFIXES = [
  '/api/gradebook',
  '/api/reports',
  '/api/materials',
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
  ],
}
