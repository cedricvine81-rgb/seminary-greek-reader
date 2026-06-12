import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { logError } from '@/lib/logger'

// PATCH /api/messages/[id] — recipient marks a message read/unread
// Body: { read: boolean }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { read } = await req.json()

    // Only the recipient may change read state — scope the update to their own message
    const result = await prisma.message.updateMany({
      where: { id: params.id, recipientId: payload.sub },
      data: { readAt: read === false ? null : new Date() },
    })
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/messages/[id]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/messages/[id] — recipient removes a message from their inbox
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await prisma.message.deleteMany({
      where: { id: params.id, recipientId: payload.sub },
    })
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/messages/[id]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
