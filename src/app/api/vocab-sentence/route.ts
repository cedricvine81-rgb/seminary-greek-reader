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

// Content words of a gloss, for spotting a rival word in the same verse that shares the target's
// meaning (e.g. clue "love" with both ἀγάπη and ἀγαπάω present — clicking either is defensible).
// Such verses are deprioritised so the answer isn't ambiguous.
const GLOSS_STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'with', 'in', 'on', 'for', 'by', 'or', 'be', 'is',
  'that', 'this', 'his', 'her', 'its', 'it', 'as', 'at', 'from', 'into', 'not', 'who', 'was', 'are', 'one', 'you'])
function glossTokens(g?: string): Set<string> {
  return new Set((g ?? '').toLowerCase().split(/[^a-z]+/).filter(t => t.length > 2 && !GLOSS_STOP.has(t)))
}
function shareToken(a: Set<string>, b: Set<string>): boolean {
  return Array.from(a).some(t => b.has(t))
}

// Near-synonym groups whose English glosses DON'T overlap literally (so the gloss-token check
// above misses them), yet a student could reasonably click either — e.g. clue "speak, say"
// (λαλέω) sitting beside λέγω. A verse where a different word shares the target's group is
// deprioritised (with fallback). Curated to the common NT confusables; extend as needed.
const CONFUSABLE_GROUPS: string[][] = [
  ['λέγω', 'λαλέω', 'φημί'],                       // say / speak
  ['ἀγαπάω', 'φιλέω'],                              // love
  ['γινώσκω', 'οἶδα', 'ἐπίσταμαι'],                // know
  ['βλέπω', 'ὁράω', 'θεωρέω', 'θεάομαι'],          // see / behold
  ['ἔρχομαι', 'πορεύομαι', 'ὑπάγω'],               // come / go
  ['πέμπω', 'ἀποστέλλω'],                          // send
  ['ποιέω', 'πράσσω'],                             // do / make
  ['λόγος', 'ῥῆμα'],                               // word
  ['καιρός', 'χρόνος'],                            // time
  ['ἄλλος', 'ἕτερος'],                             // (an)other
  ['δοῦλος', 'διάκονος', 'παῖς'],                  // servant
  ['κύριος', 'δεσπότης'],                          // lord / master
  ['δύναμις', 'ἐξουσία'],                          // power / authority
  ['ἁμαρτία', 'παράπτωμα', 'ἀνομία'],              // sin
  ['ἀγαθός', 'καλός', 'χρηστός'],                  // good
  ['καινός', 'νέος'],                              // new
  ['ζωή', 'βίος'],                                 // life
  ['πᾶς', 'ὅλος'],                                 // all / whole
  ['λαός', 'ὄχλος', 'ἔθνος'],                      // people / crowd / nation
]
const GROUP_OF = new Map<string, number>()
CONFUSABLE_GROUPS.forEach((group, i) => group.forEach(w => GROUP_OF.set(normalizeGreek(w), i)))

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
    // word is found (getChapter is cached, so repeats within a chapter are cheap). Prefer a verse
    // with no rival word sharing the target's gloss; keep the first valid one as a fallback so a
    // sentence is always returned even when every candidate has a rival.
    type Hit = { ref: string; tokens: string[]; targets: number[]; rtl: false }
    let fallback: Hit | null = null
    for (const vid of shuffle(ids).slice(0, 40)) {
      const [book, chStr, vsStr] = vid.split('.')
      const chapter = await getChapter(book, Number(chStr), 'GNT')
      const verse = chapter?.verses.find(v => v.verse === Number(vsStr))
      const words = verse?.words
      if (!words || words.length < MIN_WORDS || words.length > MAX_WORDS) continue
      const targets = words.flatMap((w, i) => (normalizeGreek(w.lexeme?.lexeme ?? '') === norm ? [i] : []))
      if (targets.length === 0) continue
      const hit: Hit = { ref: verse!.reference, tokens: words.map(w => w.surface), targets, rtl: false }
      const targetGloss = glossTokens(words[targets[0]].lexeme?.gloss)
      const targetGroup = GROUP_OF.get(norm)
      const hasRival = words.some((w, i) => {
        if (targets.includes(i)) return false
        const wn = normalizeGreek(w.lexeme?.lexeme ?? '')
        if (wn === norm) return false
        // A rival shares the clue's exact English word, OR is a curated near-synonym of it.
        return shareToken(glossTokens(w.lexeme?.gloss), targetGloss) || (targetGroup !== undefined && GROUP_OF.get(wn) === targetGroup)
      })
      if (!hasRival) return NextResponse.json(hit)
      fallback ??= hit
    }
    if (fallback) return NextResponse.json(fallback)
    return NextResponse.json({ error: 'no sentence' })
  } catch (err) {
    logError('api/vocab-sentence', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
