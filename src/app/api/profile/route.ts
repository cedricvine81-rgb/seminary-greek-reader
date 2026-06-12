import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'

export async function GET() {
  try {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { firstName: true, surname: true, title: true, institution: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(user)

  } catch (err) {
    logError('api/profile', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
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

  } catch (err) {
    logError('api/profile', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
