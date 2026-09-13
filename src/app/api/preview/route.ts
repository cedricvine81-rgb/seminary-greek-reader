import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { safeInternalPath } from '@/lib/safe-path'

const PREVIEW_COOKIE = 'instructor_preview'

export async function GET(req: NextRequest) {
  const token = await getTokenFromCookies()
  const payload = token ? verifyToken(token) : null

  const mode = req.nextUrl.searchParams.get('mode')

  if (mode === 'enter') {
    // Only instructors may enter preview mode
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    // Prevent an open redirect. Pattern-matching for a leading "/" is not enough — see
    // safeInternalPath: "//host" and "/\host" both start with a slash and both resolve to
    // another ORIGIN, which would send an instructor off-site wearing our chrome.
    const safePath = safeInternalPath(req.nextUrl.searchParams.get('redirect')) ?? '/student'
    const res = NextResponse.redirect(new URL(safePath, req.url))
    res.cookies.set(PREVIEW_COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/' })
    return res
  }

  if (mode === 'exit') {
    const res = NextResponse.redirect(new URL('/instructor', req.url))
    res.cookies.delete(PREVIEW_COOKIE)
    return res
  }

  return NextResponse.redirect(new URL('/instructor', req.url))
}
