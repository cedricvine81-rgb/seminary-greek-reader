import { NextRequest, NextResponse } from 'next/server'
import { lemmaVerseIds, hebrewVersesByStrongs } from '@/lib/search'
import { getChapter } from '@/lib/reader'
import { normalizeGreek } from '@/lib/greek-utils'
import { logError } from '@/lib/logger'

// GET /api/vocab-sentence?corpus=GNT&lemma=<greek lemma>
//     /api/vocab-sentence?corpus=MT&strongs=<digits>
// Picks a real verse containing an inflected form of the given vocabulary word and returns it as
// clickable tokens with the target position(s) marked — powers the "Identify the word" drill on
// the Vocab page. Returns { ref, tokens, targets, rtl } or { error } (e.g. no usable sentence).
// Verses are length-bounded so the sentence stays readable in the quiz card.

const MIN_WORDS = 4
const MAX_WORDS = 22

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams
    const corpus = p.get('corpus')

    // ── Hebrew (MT): match by Strong's number (covers every inflection of the lexeme) ──
    if (corpus === 'MT') {
      const strongs = (p.get('strongs') ?? '').replace(/[^0-9]/g, '')
      if (!strongs) return NextResponse.json({ error: 'missing strongs' }, { status: 400 })
      for (const v of shuffle(hebrewVersesByStrongs(strongs))) {
        const tokens = v.text.split(/[\s־]+/).filter(Boolean)
        if (tokens.length !== v.ws.length) continue          // guard: keep token↔Strong's aligned
        if (tokens.length < MIN_WORDS || tokens.length > MAX_WORDS) continue
        const targets = v.ws.flatMap((s, i) => (s === strongs ? [i] : []))
        if (targets.length === 0) continue
        return NextResponse.json({ ref: v.reference, tokens, targets, rtl: true })
      }
      return NextResponse.json({ error: 'no sentence' })
    }

    // ── Greek (GNT): match by lemma across its inflected forms ──
    const lemma = p.get('lemma') ?? ''
    const norm = normalizeGreek(lemma)
    if (!norm) return NextResponse.json({ error: 'missing lemma' }, { status: 400 })
    const ids = lemmaVerseIds(lemma)
    if (!ids || ids.length === 0) return NextResponse.json({ error: 'no sentence' })
    // Try a bounded number of random occurrences until one is the right length and its target
    // word is found (getChapter is cached, so repeats within a chapter are cheap).
    for (const vid of shuffle(ids).slice(0, 40)) {
      const [book, chStr, vsStr] = vid.split('.')
      const chapter = await getChapter(book, Number(chStr), 'GNT')
      const verse = chapter?.verses.find(v => v.verse === Number(vsStr))
      const words = verse?.words
      if (!words || words.length < MIN_WORDS || words.length > MAX_WORDS) continue
      const targets = words.flatMap((w, i) => (normalizeGreek(w.lexeme?.lexeme ?? '') === norm ? [i] : []))
      if (targets.length === 0) continue
      return NextResponse.json({ ref: verse!.reference, tokens: words.map(w => w.surface), targets, rtl: false })
    }
    return NextResponse.json({ error: 'no sentence' })
  } catch (err) {
    logError('api/vocab-sentence', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
