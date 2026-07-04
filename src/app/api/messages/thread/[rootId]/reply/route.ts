import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'
import { requireStudentAccess } from '@/lib/subscription'

// POST /api/messages/thread/[rootId]/reply — reply within a conversation.
// Either participant (the instructor or the student) may reply.
export async function POST(req: NextRequest, { params }: { params: { rootId: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const me = payload.sub
    const { rootId } = params

    const rl = rateLimit(`messages-reply:${me}`, 40, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many messages — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Message body is required.' }, { status: 400 })

    // The root anchors the conversation: courseId, subject, and the two participants.
    const root = await prisma.message.findUnique({
      where: { id: rootId },
      select: { id: true, courseId: true, subject: true, senderId: true, recipientId: true, threadId: true },
    })
    if (!root) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })

    // I must be one of the two participants
    if (me !== root.senderId && me !== root.recipientId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const other = me === root.senderId ? root.recipientId : root.senderId

    // Anchor to the true thread root even if a reply's id was passed, so threads never fragment
    const threadKey = root.threadId ?? root.id
    const subject = root.subject.startsWith('Re:') ? root.subject : `Re: ${root.subject}`

    await prisma.message.create({
      data: {
        courseId: root.courseId,
        senderId: me,
        recipientId: other,
        subject,
        body: body.trim(),
        threadId: threadKey,
      },
    })

    revalidatePath('/student/messages')
    revalidatePath('/instructor/messages')

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    logError('api/messages/thread/[rootId]/reply', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
