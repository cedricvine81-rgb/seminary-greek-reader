import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, signToken, setAuthCookie, clearAuthCookie } from '@/lib/auth'
import type { Role } from '@/types/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'signup') {
      const { firstName, surname, email, password, institution, role } = body

      if (!firstName || !surname || !email || !password || !role) {
        return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
      }

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })

      const hashed = await hashPassword(password)
      const user = await prisma.user.create({
        data: { firstName, surname, email, password: hashed, role: role as Role, institution },
      })

      const token = signToken({ sub: user.id, email: user.email, role: user.role as Role })
      setAuthCookie(token)
      return NextResponse.json({ user: { id: user.id, email, role: user.role }, token })
    }

    if (action === 'signin') {
      const { email, password } = body
      if (!email || !password) return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })

      const valid = await verifyPassword(password, user.password)
      if (!valid) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })

      const token = signToken({ sub: user.id, email: user.email, role: user.role as Role })
      setAuthCookie(token)
      return NextResponse.json({ user: { id: user.id, email, role: user.role }, token, role: user.role })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE() {
  clearAuthCookie()
  return NextResponse.json({ ok: true })
}
