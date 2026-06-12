import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { logError } from '@/lib/logger'

// GET /api/messages/thread/[rootId] — full conversation, and mark messages addressed
// to the current user as read. rootId = the thread's root message id.
export async function GET(_req: NextRequest, { params }: { params: { rootId: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const me = payload.sub
    const { rootId } = params

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ id: rootId }, { threadId: rootId }],
        AND: [{ OR: [{ senderId: me }, { recipientId: me }] }],
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, subject: true, body: true, readAt: true, createdAt: true,
        senderId: true, recipientId: true,
        course: { select: { id: true, name: true } },
        sender: { select: { id: true, firstName: true, surname: true, title: true } },
      },
    })

    if (messages.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Mark unread messages addressed to me as read
    await prisma.message.updateMany({
      where: {
        OR: [{ id: rootId }, { threadId: rootId }],
        recipientId: me,
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ messages })
  } catch (err) {
    logError('api/messages/thread/[rootId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
