import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { parseRefPart, profilePassage } from '@/lib/style-passage'

// GET /api/register/passage?corpus=GNT&book=Luke&from=1&to=2
// Profiles one passage for the Register tool. `from` and `to` are "chapter" or "chapter:verse".
//
// Server-side because the corpus indexes are read from disk and cached in-process (the same
// cache construct search uses); the browser only ever receives the finished profile, which is
// a few hundred bytes.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const corpus = (searchParams.get('corpus') ?? 'GNT').toUpperCase()
  const book = (searchParams.get('book') ?? '').trim()
  const from = parseRefPart(searchParams.get('from') ?? '')
  const to = parseRefPart(searchParams.get('to') ?? '')

  if (!book || !/^[A-Za-z0-9]{1,12}$/.test(book) || !from || !to) {
    return NextResponse.json({ error: 'bad-reference' }, { status: 400 })
  }

  try {
    const profile = profilePassage({
      corpus, book,
      fromCh: from[0], fromV: from[1],
      toCh: to[0], toV: to[1],
    })
    if (!profile) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    return NextResponse.json(profile)
  } catch (err) {
    logError('api/register/passage', err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
