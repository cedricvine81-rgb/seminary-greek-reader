import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getBooks, getChapter } from '@/lib/reader'
import type { Corpus } from '@/types/biblical-text'

/**
 * Biblical text does not change between deployments, and this route is public — no session, no
 * personalization, keyed entirely on the query string (see PUBLIC_API_PREFIXES in middleware.ts,
 * which returns a bare next() with no Set-Cookie, so the response stays cacheable).
 *
 * It is also the highest-volume endpoint in the app: every chapter every reader opens. Without a
 * Cache-Control header it ran the function and read the corpus off disk every single time. With
 * one, the edge answers repeat requests outright. Vercel gives each deployment its own cache
 * namespace, so a corpus rebuild is picked up on deploy without a manual purge; the browser-level
 * hour matches what public/data serves (see next.config.js).
 *
 * Applied ONLY to successful responses. Errors deliberately stay uncached — a transient read
 * failure pinned at the edge for a day would be far worse than the function invocation it saves.
 */
const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const corpus    = searchParams.get('corpus') as Corpus | null
  const bookOsisId = searchParams.get('book')
  const chapter   = searchParams.get('chapter')

  try {
    if (corpus && !bookOsisId) {
      const books = getBooks(corpus)
      return NextResponse.json({ books }, { headers: { 'Cache-Control': CACHE } })
    }

    if (bookOsisId && chapter) {
      const data = await getChapter(bookOsisId, Number(chapter), corpus ?? undefined)
      if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(data, { headers: { 'Cache-Control': CACHE } })
    }

    return NextResponse.json({ error: 'Provide corpus or book+chapter params.' }, { status: 400 })
  } catch (err) {
    logError('api/reader', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
