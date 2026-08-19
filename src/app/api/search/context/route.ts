import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getTranslationContext } from '@/lib/translation-search'
import { getChapter } from '@/lib/reader'
import { getBackgroundContext } from '@/lib/backgrounds-search'
import type { Corpus } from '@/types/biblical-text'

// Verse-context for the search page's slider: given the matched verse refs ("osisId.chapter.
// verse") and a radius (1–3), return each ref's neighbouring verses in the same chapter so a hit
// can be read in context. Translations come from the translation index; Greek from getChapter;
// background texts from the background index (neighbouring sections in the same work).
// POST body: { mode: 'trans'|'greek'|'bg', lang?, corpus?, radius, refs: string[] }
const MAX_REFS = 200

interface CtxVerse { chapter: number; verse: number; text: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mode = body.mode === 'greek' ? 'greek' : body.mode === 'bg' ? 'bg' : 'trans'
    const radius = Math.max(1, Math.min(3, Number(body.radius) || 0))
    const refsRaw: string[] = Array.isArray(body.refs) ? body.refs.slice(0, MAX_REFS) : []

    // Background texts: refs are opaque "source|osis|work|book|chapter|verse" keys; the index
    // knows each one's neighbours. Return the same keys so the client can match them back.
    if (mode === 'bg') {
      const lang = body.lang === 'grc' ? 'grc' : body.lang === 'es' ? 'es' : 'en'
      const context = await getBackgroundContext(lang, refsRaw, radius)
      return NextResponse.json({ context })
    }

    const refs = refsRaw.map(s => {
      const [osisId, c, v] = String(s).split('.')
      return { osisId, chapter: Number(c), verse: Number(v) }
    }).filter(r => r.osisId && Number.isFinite(r.chapter) && Number.isFinite(r.verse))
    if (refs.length === 0) return NextResponse.json({ context: {} })

    if (mode === 'trans') {
      const lang = String(body.lang || 'en')
      const context = await getTranslationContext(lang, refs, radius)
      return NextResponse.json({ context })
    }

    // Greek: load each ref's chapter plus its neighbours (so the window can cross a chapter
    // boundary within the book — radius ≤ 3, so ±1 chapter is always enough), then slice.
    const corpus = (body.corpus === 'LXX' ? 'LXX' : 'GNT') as Corpus
    const chapters = new Map<string, { osisId: string; chapter: number }>()
    for (const r of refs) for (const c of [r.chapter - 1, r.chapter, r.chapter + 1]) {
      if (c >= 1) chapters.set(`${r.osisId}.${c}`, { osisId: r.osisId, chapter: c })
    }
    const chapterVerses = new Map<string, CtxVerse[]>()
    await Promise.all(Array.from(chapters.values()).map(async ({ osisId, chapter }) => {
      const data = await getChapter(osisId, chapter, corpus)
      if (data) chapterVerses.set(`${osisId}.${chapter}`, data.verses.map(v => ({ chapter: v.chapter, verse: v.verse, text: v.text })))
    }))
    const context: Record<string, CtxVerse[]> = {}
    for (const r of refs) {
      const seq = [
        ...(chapterVerses.get(`${r.osisId}.${r.chapter - 1}`) ?? []),
        ...(chapterVerses.get(`${r.osisId}.${r.chapter}`) ?? []),
        ...(chapterVerses.get(`${r.osisId}.${r.chapter + 1}`) ?? []),
      ]
      const idx = seq.findIndex(x => x.chapter === r.chapter && x.verse === r.verse)
      context[`${r.osisId}.${r.chapter}.${r.verse}`] = idx < 0 ? [] : seq.slice(Math.max(0, idx - radius), idx + radius + 1)
    }
    return NextResponse.json({ context })
  } catch (err) {
    logError('api/search/context', err)
    return NextResponse.json({ error: 'Context failed' }, { status: 500 })
  }
}
