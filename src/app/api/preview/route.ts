import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

const PREVIEW_COOKIE = 'instructor_preview'

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null

  const mode = req.nextUrl.searchParams.get('mode')

  if (mode === 'enter') {
    // Only instructors may enter preview mode
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    const redirectTo = req.nextUrl.searchParams.get('redirect') ?? '/student'
    // Validate redirect is a relative path (prevent open redirect)
    const safePath = redirectTo.startsWith('/') ? redirectTo : '/student'
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
