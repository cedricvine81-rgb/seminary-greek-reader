import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { suggestGreekWords } from '@/lib/search'
import { suggestTranslation } from '@/lib/translation-search'

// GET /api/suggest?q=<prefix>&lang=<code?> — autocomplete word suggestions for the search
// box. With `lang`, suggests words from that translation; otherwise Greek words.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim()
  const lang = searchParams.get('lang')

  if (q.length < 2) return NextResponse.json({ words: [] })

  try {
    const words = lang ? await suggestTranslation(lang, q) : suggestGreekWords(q)
    return NextResponse.json({ words })
  } catch (err) {
    logError('api/suggest', err)
    return NextResponse.json({ words: [] })
  }
}
