import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getBooks, getChapter } from '@/lib/reader'
import type { Corpus } from '@/types/biblical-text'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const corpus    = searchParams.get('corpus') as Corpus | null
  const bookOsisId = searchParams.get('book')
  const chapter   = searchParams.get('chapter')

  try {
    if (corpus && !bookOsisId) {
      const books = getBooks(corpus)
      return NextResponse.json({ books })
    }

    if (bookOsisId && chapter) {
      const data = await getChapter(bookOsisId, Number(chapter), corpus ?? undefined)
      if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Provide corpus or book+chapter params.' }, { status: 400 })
  } catch (err) {
    logError('api/reader', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
