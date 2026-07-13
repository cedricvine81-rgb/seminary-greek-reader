import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getTranslationContext } from '@/lib/translation-search'
import { getChapter } from '@/lib/reader'
import type { Corpus } from '@/types/biblical-text'

// Verse-context for the search page's slider: given the matched verse refs ("osisId.chapter.
// verse") and a radius (1–3), return each ref's neighbouring verses in the same chapter so a hit
// can be read in context. Translations come from the translation index; Greek from getChapter.
// POST body: { mode: 'trans'|'greek', lang?, corpus?, radius, refs: string[] }
const MAX_REFS = 200

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mode = body.mode === 'greek' ? 'greek' : 'trans'
    const radius = Math.max(1, Math.min(3, Number(body.radius) || 0))
    const refsRaw: string[] = Array.isArray(body.refs) ? body.refs.slice(0, MAX_REFS) : []
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

    // Greek: load each unique chapter once, then slice the window around each ref.
    const corpus = (body.corpus === 'LXX' ? 'LXX' : 'GNT') as Corpus
    const chapters = new Map<string, { osisId: string; chapter: number }>()
    for (const r of refs) chapters.set(`${r.osisId}.${r.chapter}`, { osisId: r.osisId, chapter: r.chapter })
    const chapterVerses = new Map<string, { verse: number; text: string }[]>()
    await Promise.all(Array.from(chapters.values()).map(async ({ osisId, chapter }) => {
      const data = await getChapter(osisId, chapter, corpus)
      if (data) chapterVerses.set(`${osisId}.${chapter}`, data.verses.map(v => ({ verse: v.verse, text: v.text })))
    }))
    const context: Record<string, { verse: number; text: string }[]> = {}
    for (const r of refs) {
      const arr = chapterVerses.get(`${r.osisId}.${r.chapter}`) ?? []
      context[`${r.osisId}.${r.chapter}.${r.verse}`] = arr.filter(x => x.verse >= r.verse - radius && x.verse <= r.verse + radius)
    }
    return NextResponse.json({ context })
  } catch (err) {
    logError('api/search/context', err)
    return NextResponse.json({ error: 'Context failed' }, { status: 500 })
  }
}
