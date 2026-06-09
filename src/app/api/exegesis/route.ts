import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

// GET /api/exegesis — list sessions, or look up by assignmentId
// ?assignmentId=xxx  →  returns the session for that assignment (if any)
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/exegesis — create a new session
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, bookOsisId, bookName, chapter, verseStart, verseEnd, annotations, assignmentId } = body

    if (!bookOsisId || !chapter || !verseStart || !verseEnd) {
      return NextResponse.json({ error: 'bookOsisId, chapter, verseStart, verseEnd required' }, { status: 400 })
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
        ...(assignmentId ? { assignmentId } : {}),
      },
    })
    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
