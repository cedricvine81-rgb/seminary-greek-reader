import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { searchByGreekWord, searchByReference, searchByLemma, searchByMorph, searchByStrongs, type SearchCorpus } from '@/lib/search'
import { searchTranslation } from '@/lib/translation-search'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const type = searchParams.get('type') as 'word' | 'reference' | 'morph' | 'strongs'
  const corpus = (searchParams.get('corpus') ?? 'BOTH') as SearchCorpus
  // When set on a word search, search that translation's text instead of the Greek.
  const lang = searchParams.get('lang')
  // When 'true', treat q as a Greek lexeme and find every verse with any of its forms.
  const lemma = searchParams.get('lemma') === 'true'
  // Optional book scope (osisId, e.g. 'Matt') — used by the master search ("love in Matthew").
  const book = searchParams.get('book') || null

  try {
    // Morphology search: features (comma-separated parsing tokens) + optional lemma. No q.
    if (type === 'morph') {
      const features = (searchParams.get('features') ?? '').split(',').map(f => f.trim()).filter(Boolean)
      const lemmaFilter = searchParams.get('lemma') || undefined
      return NextResponse.json({ results: await searchByMorph({ features, lemma: lemmaFilter }, corpus) })
    }
    if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    // Strong's-number search: q is the number (e.g. '1080' or 'G1080').
    if (type === 'strongs') {
      return NextResponse.json({ results: await searchByStrongs(q, corpus) })
    }
    if (type === 'word' && lang) {
      // Book scope is applied inside the scan (not post-filtered) so late-canon hits aren't
      // lost to the result cap — e.g. "love" in Matthew, which the OT fills up first.
      const results = await searchTranslation(lang, q, 300, book)
      return NextResponse.json({ results, translation: true })
    }
    if (type === 'word' && lemma) {
      let results = await searchByLemma(q, corpus)
      if (book) results = results.filter(v => v.bookId === book)
      return NextResponse.json({ results })
    }

    let results = type === 'reference'
      ? await searchByReference(q, corpus)
      : await searchByGreekWord(q, corpus)
    if (book) results = results.filter(v => v.bookId === book)

    return NextResponse.json({ results })
  } catch (err) {
    logError('api/search', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
