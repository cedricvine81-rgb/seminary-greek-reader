import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { searchByGreekWord, searchByReference, type SearchCorpus } from '@/lib/search'
import { searchTranslation } from '@/lib/translation-search'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const type = searchParams.get('type') as 'word' | 'reference'
  const corpus = (searchParams.get('corpus') ?? 'BOTH') as SearchCorpus
  // When set on a word search, search that translation's text instead of the Greek.
  const lang = searchParams.get('lang')

  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  try {
    if (type === 'word' && lang) {
      return NextResponse.json({ results: await searchTranslation(lang, q), translation: true })
    }

    const results = type === 'reference'
      ? await searchByReference(q, corpus)
      : await searchByGreekWord(q, corpus)

    return NextResponse.json({ results })
  } catch (err) {
    logError('api/search', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
