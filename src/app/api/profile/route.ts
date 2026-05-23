import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET() {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { firstName: true, surname: true, title: true, institution: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { firstName, surname, title, institution } = await req.json()

  if (!firstName?.trim() || !surname?.trim()) {
    return NextResponse.json({ error: 'First name and surname are required.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: payload.sub },
    data: {
      firstName: firstName.trim(),
      surname:   surname.trim(),
      title:     title?.trim() || null,
      institution: institution?.trim() || null,
    },
    select: { firstName: true, surname: true, title: true, institution: true },
  })

  return NextResponse.json(updated)
}
