import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { suggestGreekLexemes, suggestHebrewLexemes } from '@/lib/search'
import { suggestTranslation } from '@/lib/translation-search'

// GET /api/suggest?q=<prefix>&lang=<code?>&hebrew=<1?> — autocomplete suggestions for the
// search box. With `hebrew`, suggests pointed Hebrew lemmas (consonant-prefix match, corpus
// frequency order, each with its gloss + Strong's number so a pick can search "all forms");
// with `lang`, words from that translation; otherwise Greek dictionary words (lexemes) with
// their glosses. Returns { suggestions: [{ word, sub?, strongs? }] }.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim()
  const lang = searchParams.get('lang')
  const hebrew = searchParams.get('hebrew')

  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const suggestions = hebrew
      ? suggestHebrewLexemes(q)
      : lang
      ? (await suggestTranslation(lang, q)).map(word => ({ word }))
      : suggestGreekLexemes(q)
    return NextResponse.json({ suggestions })
  } catch (err) {
    logError('api/suggest', err)
    return NextResponse.json({ suggestions: [] })
  }
}
