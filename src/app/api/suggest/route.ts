import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { suggestGreekLexemes } from '@/lib/search'
import { suggestTranslation } from '@/lib/translation-search'

// GET /api/suggest?q=<prefix>&lang=<code?> — autocomplete suggestions for the search box.
// With `lang`, suggests words from that translation; otherwise Greek dictionary words
// (lexemes) with their glosses. Returns { suggestions: [{ word, sub? }] } — `sub` is the
// gloss (Greek only), and `word` for Greek is a lexeme to be searched across its forms.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim()
  const lang = searchParams.get('lang')

  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const suggestions = lang
      ? (await suggestTranslation(lang, q)).map(word => ({ word }))
      : suggestGreekLexemes(q)
    return NextResponse.json({ suggestions })
  } catch (err) {
    logError('api/suggest', err)
    return NextResponse.json({ suggestions: [] })
  }
}
