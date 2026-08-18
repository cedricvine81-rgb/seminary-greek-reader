import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isInstructorOfCourse } from '@/lib/course-auth'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'
import { requireStudentAccess } from '@/lib/subscription'

type Participant = { id: string; firstName: string; surname: string; title: string | null; email?: string }

// GET /api/messages — conversation threads the current user is part of (either role).
// Each thread is a 1:1 conversation between an instructor and a student, or — when
// the recipient has opted in — between two students in the same course.
const MAX_BODY = 20_000   // characters in one message body
const MAX_LIST = 500      // most recent messages considered when building the thread list

export async function GET(_req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate

    const me = payload.sub
    // Exclude messages this user has deleted from their own side.
    // Newest-first with a ceiling, then re-sorted below. Unbounded, this pulled EVERY
    // message body the user had ever sent or received on each page load — and a broadcast
    // is one full copy per student, so an instructor's list grew by class-size every
    // announcement. The cap is far above a semester of real conversation.
    const messages = (await prisma.message.findMany({
      where: { OR: [{ senderId: me, senderDeletedAt: null }, { recipientId: me, recipientDeletedAt: null }] },
      orderBy: { createdAt: 'desc' },
      take: MAX_LIST,
      select: {
        id: true, subject: true, body: true, threadId: true, broadcastId: true, readAt: true, createdAt: true,
        senderId: true, recipientId: true,
        course: { select: { id: true, name: true } },
        sender: { select: { id: true, firstName: true, surname: true, title: true, role: true, email: true, messagingConsent: true } },
        recipient: { select: { id: true, firstName: true, surname: true, title: true, role: true, email: true, messagingConsent: true } },
      },
    })).reverse()   // oldest-first, as the thread grouping below expects

    type Thread = {
      rootId: string; subject: string; course: { id: string; name: string }; other: Participant
      lastBody: string; lastAt: Date; unread: number; count: number
      rootSenderId: string; rootBroadcastId: string | null; isBroadcast: boolean; recipients: number
    }
    // Group into threads keyed by (threadId ?? id). Roots have threadId null.
    const threads = new Map<string, Thread>()

    for (const m of messages) {
      const key = m.threadId ?? m.id
      const otherRaw = m.senderId === me ? m.recipient : m.sender
      // The other party's own consent governs whether I get to see their email —
      // it's their choice to reveal it, not mine to request it.
      const revealEmail = otherRaw.role === 'STUDENT' && otherRaw.messagingConsent
      const other: Participant = {
        id: otherRaw.id, firstName: otherRaw.firstName, surname: otherRaw.surname, title: otherRaw.title,
        email: revealEmail ? otherRaw.email : undefined,
      }
      const existing = threads.get(key)
      const isUnread = m.recipientId === me && m.readAt === null
      if (!existing) {
        threads.set(key, {
          rootId: key, subject: m.subject, course: m.course, other,
          lastBody: m.body, lastAt: m.createdAt, unread: isUnread ? 1 : 0, count: 1,
          rootSenderId: m.senderId, rootBroadcastId: m.broadcastId, isBroadcast: false, recipients: 1,
        })
      } else {
        existing.lastBody = m.body
        existing.lastAt = m.createdAt
        existing.unread += isUnread ? 1 : 0
        existing.count += 1
      }
    }

    // Collapse a class-wide broadcast (one copy per student, no replies) that I sent
    // into a single row, so the announcement is listed once — not once per student.
    const out: Thread[] = []
    const broadcasts = new Map<string, Thread>()
    for (const t of Array.from(threads.values())) {
      if (t.rootSenderId === me && t.rootBroadcastId && t.count === 1) {
        const g = broadcasts.get(t.rootBroadcastId)
        if (!g) broadcasts.set(t.rootBroadcastId, { ...t, rootId: `b:${t.rootBroadcastId}`, isBroadcast: true, recipients: 1 })
        else { g.recipients += 1; if (t.lastAt.getTime() > g.lastAt.getTime()) { g.lastAt = t.lastAt; g.lastBody = t.lastBody } }
      } else {
        out.push(t)
      }
    }
    for (const g of Array.from(broadcasts.values())) out.push(g)
    out.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    return NextResponse.json({ threads: out })
  } catch (err) {
    logError('api/messages', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST /api/messages — instructor sends to a whole class or an individual student
// Body: { courseId, recipientId?: string | null, subject, body }
//   recipientId omitted/null → broadcast to all APPROVED students in the course
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate

    // Throttle to prevent accidental/abusive bulk sends
    const rl = rateLimit(`messages-send:${payload.sub}`, 30, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many messages — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const { courseId, recipientId, groupId, subject, body } = await req.json()
    if (!courseId || !subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'courseId, subject, and body are required.' }, { status: 400 })
    }
    if (subject.length > 200) {
      return NextResponse.json({ error: 'Subject must be 200 characters or fewer.' }, { status: 400 })
    }
    // The body was uncapped. A class broadcast stores one full COPY per recipient, so an
    // oversized body is multiplied by the class size in a single insert — and then re-read
    // in full by the thread list below. 20k characters is far more than any real message
    // and matches the cap the notes/annotations routes already use.
    if (body.length > MAX_BODY) {
      return NextResponse.json({
        error: `Message is too long (${body.length.toLocaleString()} characters). The limit is ${MAX_BODY.toLocaleString()}.`,
      }, { status: 400 })
    }

    // ── Student-initiated message → the course's instructor by default, or a
    //    coursemate who has opted in to being messaged (recipientId provided) ──
    if (payload.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { courseId, userId: payload.sub, status: 'APPROVED' },
        select: { id: true },
      })
      if (!enrollment) return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 })

      // ── Message my own group's other members ──
      if (groupId) {
        const membership = await prisma.courseGroupMember.findFirst({
          where: { groupId, userId: payload.sub, group: { courseId } },
          select: { id: true },
        })
        if (!membership) return NextResponse.json({ error: 'You are not a member of that group.' }, { status: 403 })
        const others = await prisma.courseGroupMember.findMany({
          // messagingConsent is honoured here as it is for direct classmate messages: a
          // student who declined peer messaging at signup was still reachable through any
          // group they shared, which is the one promise the setting makes.
          where: { groupId, userId: { not: payload.sub },
                   user: { deletedAt: null, messagingConsent: true } },
          select: { userId: true },
        })
        const groupRecipients = others.map(m => m.userId)
        if (groupRecipients.length === 0) {
          return NextResponse.json({
            error: 'No one in your group can be messaged yet — group members choose whether to receive messages.',
          }, { status: 400 })
        }
        const groupBroadcastId = crypto.randomUUID()
        await prisma.message.createMany({
          data: groupRecipients.map(rid => ({
            courseId, senderId: payload.sub, recipientId: rid,
            subject: subject.trim(), body: body.trim(), broadcastId: groupBroadcastId,
          })),
        })
        revalidatePath('/student/messages')
        revalidatePath('/instructor/messages')
        return NextResponse.json({ ok: true, sent: groupRecipients.length }, { status: 201 })
      }

      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      })
      if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })

      let targetId = course.instructorId
      if (recipientId && recipientId !== course.instructorId) {
        // Messaging a classmate directly — only allowed if they're an approved,
        // opted-in student enrolled in the same course.
        const target = await prisma.user.findFirst({
          where: {
            id: recipientId, role: 'STUDENT', deletedAt: null, messagingConsent: true,
            enrollments: { some: { courseId, status: 'APPROVED' } },
          },
          select: { id: true },
        })
        if (!target) return NextResponse.json({ error: 'That classmate is not available to message.' }, { status: 403 })
        targetId = target.id
      }

      await prisma.message.create({
        data: {
          courseId,
          senderId: payload.sub,
          recipientId: targetId,
          subject: subject.trim(),
          body: body.trim(),
        },
      })

      revalidatePath('/instructor/messages')
      revalidatePath('/student/messages')
      return NextResponse.json({ ok: true, sent: 1 }, { status: 201 })
    }

    // ── Instructor-initiated message (individual or whole-class broadcast) ──
    if (payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorize: the sender must own or co-teach this course
    if (!await isInstructorOfCourse(courseId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Resolve recipients
    let recipientIds: string[]
    let broadcastId: string | null = null
    if (groupId) {
      // Message every member of one of this course's groups.
      const group = await prisma.courseGroup.findFirst({
        where: { id: groupId, courseId },
        select: { id: true },
      })
      if (!group) return NextResponse.json({ error: 'Group not found in this course.' }, { status: 404 })
      const members = await prisma.courseGroupMember.findMany({
        where: { groupId, user: { deletedAt: null } },
        select: { userId: true },
      })
      recipientIds = members.map(m => m.userId)
      if (recipientIds.length === 0) {
        return NextResponse.json({ error: 'This group has no members yet.' }, { status: 400 })
      }
      broadcastId = crypto.randomUUID()
    } else if (recipientId) {
      // Verify the target is an approved student in this course
      const enrollment = await prisma.enrollment.findFirst({
        where: { courseId, userId: recipientId, status: 'APPROVED' },
        select: { id: true },
      })
      if (!enrollment) return NextResponse.json({ error: 'Recipient is not enrolled in this course.' }, { status: 400 })
      recipientIds = [recipientId]
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: 'APPROVED', user: { deletedAt: null } },
        select: { userId: true },
      })
      recipientIds = enrollments.map(e => e.userId)
      if (recipientIds.length === 0) {
        return NextResponse.json({ error: 'This course has no enrolled students yet.' }, { status: 400 })
      }
      broadcastId = crypto.randomUUID()
    }

    await prisma.message.createMany({
      data: recipientIds.map(rid => ({
        courseId,
        senderId: payload.sub,
        recipientId: rid,
        subject: subject.trim(),
        body: body.trim(),
        broadcastId,
      })),
    })

    // Recipients see the new message immediately on next navigation/focus
    revalidatePath('/student/messages')
    revalidatePath('/student')
    revalidatePath('/instructor/messages')

    return NextResponse.json({ ok: true, sent: recipientIds.length }, { status: 201 })
  } catch (err) {
    logError('api/messages', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
