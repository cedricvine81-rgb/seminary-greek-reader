import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { searchByGreekWord, searchByReference, searchByLemma, searchByMorph, searchByStrongs, searchHebrewByStrongs, searchHebrewBySurface, verseTextsByIds, type SearchCorpus } from '@/lib/search'
import { searchTranslation } from '@/lib/translation-search'
import { searchConstruct, searchConstructAll } from '@/lib/construct-search'
import { CONSTRUCT_ALL, corpusInfo, decodeConstruct, isProseCorpus, queryIsRunnable } from '@/lib/construct-query'
import { proseHitText } from '@/lib/construct-prose'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const type = searchParams.get('type') as 'word' | 'reference' | 'morph' | 'strongs' | 'construct'
  const corpus = (searchParams.get('corpus') ?? 'BOTH') as SearchCorpus
  // When set on a word search, search that translation's text instead of the Greek.
  const lang = searchParams.get('lang')
  // When 'true', treat q as a Greek lexeme and find every verse with any of its forms.
  const lemma = searchParams.get('lemma') === 'true'
  // Optional book scope — one or more osisIds (comma-separated 'books', or legacy single
  // 'book'). Used by the master search ("love in Matthew", or a range of books).
  const booksList = (searchParams.get('books') || searchParams.get('book') || '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const books = booksList.length ? booksList : null

  try {
    // Morphology search: features (comma-separated parsing tokens) + optional lemma. No q.
    if (type === 'morph') {
      const features = (searchParams.get('features') ?? '').split(',').map(f => f.trim()).filter(Boolean)
      const lemmaFilter = searchParams.get('lemma') || undefined
      return NextResponse.json({ results: await searchByMorph({ features, lemma: lemmaFilter }, corpus) })
    }
    // Construct search: two or three morphological terms within N words of each other.
    // Criteria travel in the same compact URL form the builder puts in the address bar
    // (construct-query.ts), so an API call and a shareable link are the same string. NT-only.
    if (type === 'construct') {
      const query = decodeConstruct(Object.fromEntries(searchParams.entries()))
      if (!queryIsRunnable(query)) return NextResponse.json({ results: [], truncated: false })
      // Every corpus at once: a true count per corpus plus a small sample, each shaped for the
      // renderer that corpus uses.
      if (query.corpus === CONSTRUCT_ALL) {
        const { tallies, total } = searchConstructAll(query, 5)
        return NextResponse.json({
          all: true,
          total,
          corpora: tallies.map(t => {
            if (isProseCorpus(t.corpus)) {
              return {
                corpus: t.corpus, count: t.count, prose: true,
                results: t.hits.map(h => {
                  const pt = proseHitText(h.bookId, h.chapter, h.verse)
                  return {
                    bookId: h.bookId, chapter: h.chapter, verse: h.verse,
                    reference: pt?.reference ?? `${h.bookId} ${h.chapter}:${h.verse}`,
                    text: pt?.greek ?? '', english: pt?.english ?? '',
                    target: pt?.target ?? null,
                    matchedWords: h.matchedWords, crossesVerse: h.crossesVerse,
                  }
                }),
              }
            }
            const texts = verseTextsByIds(t.hits.map(h => h.verseId))
            const corpusAligned = corpusInfo(t.corpus).readerAligned
            return {
              corpus: t.corpus, count: t.count, prose: false,
              results: t.hits.map(h => ({
                bookId: h.bookId, chapter: h.chapter, verse: h.verse,
                text: texts.get(h.verseId) ?? '',
                matchedLemmas: h.matchedLemmas,
                // Only where the index and the reader agree on tokenisation.
                ...(corpusAligned || h.aligned ? { matchedWords: h.matchedWords } : {}),
                crossesVerse: h.crossesVerse,
              })),
            }
          }),
        })
      }
      const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 300, 1), 300)
      const { hits, total, truncated, termTotals } = searchConstruct(query, limit)
      // Prose hits aren't in the biblical search index, and carry their own name and Texts link.
      if (isProseCorpus(query.corpus)) {
        return NextResponse.json({
          truncated, total, termTotals,
          prose: true,
          results: hits.map(h => {
            const t = proseHitText(h.bookId, h.chapter, h.verse)
            return {
              bookId: h.bookId, chapter: h.chapter, verse: h.verse,
              reference: t?.reference ?? `${h.bookId} ${h.chapter}:${h.verse}`,
              text: t?.greek ?? '',
              english: t?.english ?? '',
              target: t?.target ?? null,
              matchedWords: h.matchedWords,
              crossesVerse: h.crossesVerse,
            }
          }),
        })
      }
      const texts = verseTextsByIds(hits.map(h => h.verseId))
      // Per corpus, then per verse: the GNT aligns for about 90% of its verses.
      const corpusAligned = corpusInfo(query.corpus).readerAligned
      return NextResponse.json({
        truncated, total, termTotals,
        results: hits.map(h => ({
          bookId: h.bookId, chapter: h.chapter, verse: h.verse,
          text: texts.get(h.verseId) ?? '',
          matchedLemmas: h.matchedLemmas,
          ...(corpusAligned || h.aligned ? { matchedWords: h.matchedWords } : {}),
          crossesVerse: h.crossesVerse,
        })),
      })
    }
    if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    // Hebrew (Masoretic Text) word search: "all forms" (type=strongs) covers every inflection of
    // a lexeme via its Strong's number; "this form" (type=word) is a consonantal surface match.
    if (corpus === 'MT') {
      const results = type === 'strongs' ? await searchHebrewByStrongs(q) : await searchHebrewBySurface(q)
      return NextResponse.json({ results, hebrew: true })
    }
    // Strong's-number search: q is the number (e.g. '1080' or 'G1080').
    if (type === 'strongs') {
      return NextResponse.json({ results: await searchByStrongs(q, corpus) })
    }
    if (type === 'word' && lang) {
      // Book scope is applied inside the scan (not post-filtered) so late-canon hits aren't
      // lost to the result cap — e.g. "love" in Matthew, which the OT fills up first.
      // rank=1 → relevance order (Master Search); default → canonical reading order.
      const rank = searchParams.get('rank') === '1'
      const results = await searchTranslation(lang, q, 300, books, rank)
      return NextResponse.json({ results, translation: true })
    }
    if (type === 'word' && lemma) {
      let results = await searchByLemma(q, corpus)
      if (books) results = results.filter(v => books.includes(v.bookId))
      return NextResponse.json({ results })
    }

    let results = type === 'reference'
      ? await searchByReference(q, corpus)
      : await searchByGreekWord(q, corpus)
    if (books) results = results.filter(v => books.includes(v.bookId))

    return NextResponse.json({ results })
  } catch (err) {
    logError('api/search', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
