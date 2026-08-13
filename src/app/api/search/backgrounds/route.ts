import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { searchBackgrounds, detectLang, type BgLang } from '@/lib/backgrounds-search'

// Full-text search over the embedded background-source texts (Philo, Josephus, the
// Septuagint, Apocrypha, Pseudepigrapha, the Testaments). `lang` picks the facet
// (en = English translations/prose, grc = Septuagint Greek); if omitted it's auto-detected
// from the query's script.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  const langParam = searchParams.get('lang')
  const lang: BgLang = langParam === 'en' || langParam === 'grc' ? langParam : detectLang(q)
  // Optional collection scope (a TEXT_CATEGORIES id, e.g. 'josephus', 'pseudepigrapha').
  const category = searchParams.get('category') || null
  // Optional single-work scope (a TEXT_CATEGORIES work id, e.g. 'antiquities') — used by the
  // Texts reader's own search box, which searches the whole of the work being read.
  const work = searchParams.get('work') || null
  try {
    const result = await searchBackgrounds(q, lang, 300, category, work)
    return NextResponse.json(result)
  } catch (err) {
    logError('api/search/backgrounds', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
