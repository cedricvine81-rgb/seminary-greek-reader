import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { requireStudentAccess } from '@/lib/subscription'

// GET /api/messages/thread/[rootId] — full conversation, and mark messages addressed
// to the current user as read. rootId = the thread's root message id.
export async function GET(_req: NextRequest, { params }: { params: { rootId: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const me = payload.sub
    const { rootId } = params

    // A collapsed class broadcast ("b:<broadcastId>") — show the announcement once.
    if (rootId.startsWith('b:')) {
      const broadcastId = rootId.slice(2)
      const msg = await prisma.message.findFirst({
        where: { broadcastId, senderId: me, senderDeletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, subject: true, body: true, readAt: true, createdAt: true, senderId: true, recipientId: true,
          course: { select: { id: true, name: true } },
          sender: { select: { id: true, firstName: true, surname: true, title: true } },
        },
      })
      if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const recipients = await prisma.message.count({ where: { broadcastId, senderId: me } })
      return NextResponse.json({ messages: [msg], broadcast: true, recipients })
    }

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

// DELETE /api/messages/thread/[rootId] — remove a conversation (or a class broadcast)
// from the current user's view only. Per-user soft delete: the other party keeps it.
export async function DELETE(_req: NextRequest, { params }: { params: { rootId: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const me = payload.sub
    const { rootId } = params
    const now = new Date()

    if (rootId.startsWith('b:')) {
      // Instructor removes a whole-class broadcast from their own view (all copies).
      await prisma.message.updateMany({
        where: { broadcastId: rootId.slice(2), senderId: me },
        data: { senderDeletedAt: now },
      })
      return NextResponse.json({ ok: true })
    }

    // A normal thread: hide every message in it from whichever side I'm on.
    const scope = { OR: [{ id: rootId }, { threadId: rootId }] }
    await prisma.$transaction([
      prisma.message.updateMany({ where: { ...scope, senderId: me }, data: { senderDeletedAt: now } }),
      prisma.message.updateMany({ where: { ...scope, recipientId: me }, data: { recipientDeletedAt: now } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/messages/thread/[rootId] DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
