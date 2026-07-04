import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { requireStudentAccess } from '@/lib/subscription'

// GET /api/exegesis — list sessions, or look up by assignmentId
// ?assignmentId=xxx  →  returns the session for that assignment (if any)
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate

    const assignmentId = req.nextUrl.searchParams.get('assignmentId')

    if (assignmentId) {
      const session = await prisma.exegesisSession.findFirst({
        where: { userId: payload.sub, assignmentId },
        orderBy: { updatedAt: 'desc' },
      })
      return NextResponse.json({ session: session ?? null })
    }

    const sessions = await prisma.exegesisSession.findMany({
      where: { userId: payload.sub },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, bookOsisId: true, bookName: true,
        chapter: true, verseStart: true, verseEnd: true,
        assignmentId: true, submittedAt: true,
        createdAt: true, updatedAt: true,
      },
    })
    return NextResponse.json({ sessions })
  } catch (err) {
    logError('api/exegesis', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/exegesis — create a new session
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate

    // Throttle session creation per user
    const rl = rateLimit(`exegesis-create:${payload.sub}`, 15, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const body = await req.json()
    const { title, bookOsisId, bookName, chapter, verseStart, verseEnd, annotations, verseTranslations, assignmentId, startedAt: clientStartedAt } = body

    if (!bookOsisId || !chapter || !verseStart || !verseEnd) {
      return NextResponse.json({ error: 'bookOsisId, chapter, verseStart, verseEnd required' }, { status: 400 })
    }

    // Guard against duplicate sessions for the same (user, assignment) pair
    if (assignmentId) {
      const duplicate = await prisma.exegesisSession.findFirst({
        where: { userId: payload.sub, assignmentId },
        select: { id: true },
      })
      if (duplicate) {
        return NextResponse.json({ error: 'A session for this assignment already exists', sessionId: duplicate.id }, { status: 409 })
      }
    }

    const session = await prisma.exegesisSession.create({
      data: {
        userId: payload.sub,
        title: title || `${bookName ?? bookOsisId} ${chapter}:${verseStart}${verseEnd !== verseStart ? `–${verseEnd}` : ''}`,
        bookOsisId,
        bookName: bookName ?? bookOsisId,
        chapter: Number(chapter),
        verseStart: Number(verseStart),
        verseEnd: Number(verseEnd),
        annotations: annotations ?? {},
        verseTranslations: verseTranslations ?? {},
        ...(assignmentId ? {
          assignmentId,
          startedAt: clientStartedAt ? new Date(clientStartedAt) : new Date(),
        } : {}),
      },
    })
    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    logError('api/exegesis', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
