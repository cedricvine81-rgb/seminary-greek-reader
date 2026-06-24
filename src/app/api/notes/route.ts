import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { listNotebook, notesForPassage, createNote, updateNote, deleteNote } from '@/lib/notes'

// GET: the whole notebook (folders + notes), or notes for a passage when
// ?book=&chapter=&verseStart=&verseEnd= are supplied.
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const p = req.nextUrl.searchParams
    const book = p.get('book')
    if (book) {
      const chapter = Number(p.get('chapter'))
      const vs = Number(p.get('verseStart') || p.get('verse'))
      const ve = Number(p.get('verseEnd') || p.get('verseStart') || p.get('verse'))
      if (!chapter || !vs) return NextResponse.json({ error: 'Bad passage' }, { status: 400 })
      const notes = await notesForPassage(payload.sub, book, chapter, vs, ve)
      return NextResponse.json({ notes })
    }
    return NextResponse.json(await listNotebook(payload.sub))
  } catch (err) {
    logError('api/notes GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const b = await req.json()
    if (!b.book || !b.chapter || !b.verse) return NextResponse.json({ error: 'Missing verse' }, { status: 400 })
    const note = await createNote(payload.sub, {
      book: b.book, chapter: Number(b.chapter), verse: Number(b.verse),
      verseEnd: b.verseEnd ? Number(b.verseEnd) : null, body: b.body ?? '', folderId: b.folderId ?? null,
    })
    return NextResponse.json({ note }, { status: 201 })
  } catch (err) {
    logError('api/notes POST', err)
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
    const note = await updateNote(payload.sub, id, { body: b.body, folderId: b.folderId })
    return NextResponse.json({ note })
  } catch (err) {
    logError('api/notes PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteNote(payload.sub, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/notes DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
