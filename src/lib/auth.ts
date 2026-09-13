import { sign, verify } from 'jsonwebtoken'
import { hash, compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import type { JWTPayload, AuthUser } from '@/types/auth'
import { JWT_EXPIRY, JWT_MAX_AGE_SECONDS, BCRYPT_ROUNDS } from './constants'

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable must be set in production')
}
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export async function hashPassword(password: string) {
  return hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed)
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  ;(await cookies()).set('sg_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: JWT_MAX_AGE_SECONDS,
    path: '/',
  })
}

export async function clearAuthCookie() {
  ;(await cookies()).delete('sg_token')
}

export async function getTokenFromCookies(): Promise<string | null> {
  return (await cookies()).get('sg_token')?.value ?? null
}

/**
 * Resolve the authenticated user's JWT payload from the request cookies,
 * or null if absent/invalid. Use this in API route handlers instead of
 * redefining a local `getPayload()` in every file.
 */
export async function getPayload(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies()
  return token ? verifyToken(token) : null
}

/**
 * Resolve the payload and assert a required role. Returns the payload when
 * authorized, or null when unauthenticated / wrong role. Callers return 401.
 */
export async function requireRole(role: JWTPayload['role']): Promise<JWTPayload | null> {
  const payload = await getPayload()
  return payload && payload.role === role ? payload : null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getTokenFromCookies()
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    firstName: '',
    surname: '',
  }
}
