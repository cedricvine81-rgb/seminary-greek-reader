import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { highlightsForPassage, createHighlight, updateHighlightColor, deleteHighlight } from '@/lib/highlights'

// GET: highlights for a passage — ?book=&chapter=&verseStart=&verseEnd=
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const p = req.nextUrl.searchParams
    const book = p.get('book')
    const chapter = Number(p.get('chapter'))
    const vs = Number(p.get('verseStart') || p.get('verse'))
    const ve = Number(p.get('verseEnd') || p.get('verseStart') || p.get('verse'))
    if (!book || !chapter || !vs) return NextResponse.json({ error: 'Bad passage' }, { status: 400 })
    const highlights = await highlightsForPassage(payload.sub, book, chapter, vs, ve)
    return NextResponse.json({ highlights })
  } catch (err) {
    logError('api/highlights GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const b = await req.json()
    if (!b.book || !b.chapter || !b.verse || b.startOffset == null || b.endOffset == null) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const highlight = await createHighlight(payload.sub, {
      book: b.book, chapter: Number(b.chapter), verse: Number(b.verse),
      startOffset: Number(b.startOffset), endOffset: Number(b.endOffset), color: b.color,
    })
    return NextResponse.json({ highlight }, { status: 201 })
  } catch (err) {
    logError('api/highlights POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const b = await req.json()
    if (!b.color) return NextResponse.json({ error: 'Missing color' }, { status: 400 })
    const highlight = await updateHighlightColor(payload.sub, id, b.color)
    return NextResponse.json({ highlight })
  } catch (err) {
    logError('api/highlights PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteHighlight(payload.sub, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/highlights DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
