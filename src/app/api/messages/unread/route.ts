import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { logError } from '@/lib/logger'
import { requireStudentAccess } from '@/lib/subscription'

// GET /api/messages/unread — count of unread messages for the current user (for nav badge)
export async function GET() {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate

    // recipientDeletedAt matters here: deleting an UNREAD thread removes it from the list
    // (which filters on that column) without marking it read, so the badge kept counting a
    // conversation the student no longer had any way to open and clear.
    const count = await prisma.message.count({
      where: { recipientId: payload.sub, readAt: null, recipientDeletedAt: null },
    })
    return NextResponse.json({ count })
  } catch (err) {
    logError('api/messages/unread', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
