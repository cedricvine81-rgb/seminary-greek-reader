import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireStudentAccess } from '@/lib/subscription'

// Phrase diagrams for the Diagramming tab — one per user per sentence card, upserted whole.

// GET: every diagram the user has in a chapter — ?book=&chapter=
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const p = req.nextUrl.searchParams
    const book = p.get('book')
    const chapter = Number(p.get('chapter'))
    if (!book || !chapter) return NextResponse.json({ error: 'Bad passage' }, { status: 400 })
    const diagrams = await prisma.phraseDiagram.findMany({
      where: { userId: payload.sub, book, chapter },
      select: { verseStart: true, verseEnd: true, data: true },
    })
    return NextResponse.json({ diagrams })
  } catch (err) {
    logError('api/diagrams GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// PUT: upsert one sentence's diagram — { book, chapter, verseStart, verseEnd, data }
export async function PUT(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const b = await req.json()
    if (!b.book || !b.chapter || b.verseStart == null || b.verseEnd == null || !b.data) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const anchor = {
      userId: payload.sub, book: String(b.book), chapter: Number(b.chapter),
      verseStart: Number(b.verseStart), verseEnd: Number(b.verseEnd),
    }
    await prisma.phraseDiagram.upsert({
      where: { userId_book_chapter_verseStart_verseEnd: anchor },
      create: { ...anchor, data: b.data },
      update: { data: b.data },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/diagrams PUT', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE: reset one sentence's diagram — ?book=&chapter=&verseStart=&verseEnd=
export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const gate = await requireStudentAccess(payload); if (gate) return gate
    const p = req.nextUrl.searchParams
    const book = p.get('book')
    const chapter = Number(p.get('chapter'))
    const verseStart = Number(p.get('verseStart'))
    const verseEnd = Number(p.get('verseEnd'))
    if (!book || !chapter || !verseStart || !verseEnd) {
      return NextResponse.json({ error: 'Bad passage' }, { status: 400 })
    }
    await prisma.phraseDiagram.deleteMany({
      where: { userId: payload.sub, book, chapter, verseStart, verseEnd },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/diagrams DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
