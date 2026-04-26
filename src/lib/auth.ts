import { sign, verify } from 'jsonwebtoken'
import { hash, compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import type { JWTPayload, AuthUser } from '@/types/auth'
import { JWT_EXPIRY, BCRYPT_ROUNDS } from './constants'

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

export function setAuthCookie(token: string) {
  cookies().set('sg_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearAuthCookie() {
  cookies().delete('sg_token')
}

export function getTokenFromCookies(): string | null {
  return cookies().get('sg_token')?.value ?? null
}

export function getCurrentUser(): AuthUser | null {
  const token = getTokenFromCookies()
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
