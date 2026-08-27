import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import type { Corpus, BiblicalVerse } from '@/types/biblical-text'
import { prisma } from './db'

export type SearchCorpus = Corpus | 'BOTH'

// ─── Search-index cache ───────────────────────────────────────────────────────

interface IndexVerse {
  id: string
  bookId: string
  chapter: number
  verse: number
  reference: string
  text: string
  bookName: string
  bookAbbrev: string
  corpus: Corpus
}

import { normalizeGreek } from './greek-utils'

interface IndexEntry {
  verse: IndexVerse
  normalizedText: string
}

let _index: IndexVerse[] | null = null
let _normalizedIndex: IndexEntry[] | null = null

function getIndex(): IndexVerse[] {
  if (_index) return _index
  const file = path.join(process.cwd(), 'public', 'data', 'search-index.json')
  try {
    _index = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    _index = []
  }
  return _index!
}

function getNormalizedIndex(): IndexEntry[] {
  if (_normalizedIndex) return _normalizedIndex
  _normalizedIndex = getIndex().map(verse => ({
    verse,
    normalizedText: normalizeGreek(verse.text),
  }))
  return _normalizedIndex
}

function indexToVerse(v: IndexVerse): BiblicalVerse {
  return { id: v.id, bookId: v.bookId, chapter: v.chapter, verse: v.verse,
           reference: v.reference, text: v.text }
}

// ─── Text search ──────────────────────────────────────────────────────────────

export async function searchByGreekWord(
  query: string,
  corpus: SearchCorpus,
): Promise<BiblicalVerse[]> {
  const q = normalizeGreek(query)
  return getNormalizedIndex()
    .filter(e => (corpus === 'BOTH' || e.verse.corpus === corpus) && e.normalizedText.includes(q))
    .map(e => indexToVerse(e.verse))
}

export async function searchByReference(
  ref: string,
  corpus: SearchCorpus,
  limit = 50,
): Promise<BiblicalVerse[]> {
  const q = ref.toLowerCase()
  return getIndex()
    .filter(v => (corpus === 'BOTH' || v.corpus === corpus) && v.reference.toLowerCase().includes(q))
    .slice(0, limit)
    .map(indexToVerse)
}

// ─── Word suggestions (autocomplete) & lemma search ──────────────────────────

// A comprehensive Greek lemma index (scripts/build-lemma-index.mjs): every lemma with a
// gloss, frequency, and the verses it occurs in (in any inflected form). Built from the
// parsing trees, so it covers every word — not just the vocabulary lexicon; ranked by frequency.
//
// `v` and `f` are the New Testament. The Septuagint is kept apart in `lx`/`lf` deliberately:
// suggestGreekLexemes and lemmaVerseIds both read `v`, and merging would put Septuagint verses
// into New Testament vocabulary suggestions and into the vocab drill's example sentences.
interface LemmaEntry { n: string; l: string; g: string; f: number; v: string[]; lf?: number; lx?: string[] }
let _lemmaIndex: LemmaEntry[] | null = null
let _lemmaByNorm: Map<string, LemmaEntry> | null = null

function getLemmaIndex(): LemmaEntry[] {
  if (_lemmaIndex) return _lemmaIndex
  const file = path.join(process.cwd(), 'public', 'data', 'lemma-index.json.gz')
  try {
    _lemmaIndex = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'))
  } catch {
    _lemmaIndex = []
  }
  return _lemmaIndex!
}
function getLemmaByNorm(): Map<string, LemmaEntry> {
  if (_lemmaByNorm) return _lemmaByNorm
  _lemmaByNorm = new Map(getLemmaIndex().map(e => [e.n, e] as [string, LemmaEntry]))
  return _lemmaByNorm
}

// Greek suggestions are dictionary words (lexemes), not inflected surface forms, so typing
// "λογ" offers distinct words (λόγος, λογίζομαι, λόγιον…) each with its gloss.
export function suggestGreekLexemes(prefix: string, limit = 12): { word: string; sub: string }[] {
  const p = normalizeGreek(prefix)
  if (p.length < 2) return []
  const out: { word: string; sub: string }[] = []
  for (const e of getLemmaIndex()) {          // pre-sorted by frequency
    // Skip lexemes that occur only in the Septuagint (f === 0). They carry no gloss — the trees
    // are the only source of one — so they would appear as a bare word with an empty subtitle.
    if (e.f === 0) continue
    if (e.n.startsWith(p)) { out.push({ word: e.l, sub: e.g }); if (out.length >= limit) break }
  }
  return out
}

// Verse IDs (e.g. "Matt.1.1") containing any inflected form of a Greek lemma, or null if the
// lemma is unknown. Used by /api/vocab-sentence to pick a real sentence for the vocab drill.
export function lemmaVerseIds(lemma: string): string[] | null {
  const entry = getLemmaByNorm().get(normalizeGreek(lemma))
  return entry ? entry.v : null
}

// Every verse containing any inflected form of a lexeme — straight from the lemma index.
//
// The corpus decides which verse list is consulted: the New Testament's `v`, the Septuagint's
// `lx`, or both. Asking the Septuagint used to filter the GNT list by corpus and hand back the
// empty set that necessarily produced — "no matches", indistinguishable from the word being
// absent. A lexeme with no list for the corpus asked for now falls back to surface search rather
// than reporting nothing, which is what an unknown lemma has always done.
export async function searchByLemma(lexeme: string, corpus: SearchCorpus): Promise<BiblicalVerse[]> {
  const entry = getLemmaByNorm().get(normalizeGreek(lexeme))
  if (!entry) return searchByGreekWord(lexeme, corpus)  // unknown lemma → fall back to surface search
  const ids = corpus === 'LXX' ? (entry.lx ?? [])
    : corpus === 'GNT' ? entry.v
    : [...entry.v, ...(entry.lx ?? [])]
  if (ids.length === 0) return searchByGreekWord(lexeme, corpus)
  const vset = new Set(ids)
  const out: BiblicalVerse[] = []
  for (const v of getIndex()) {               // iterate the index for canonical order
    if ((corpus === 'BOTH' || v.corpus === corpus) && vset.has(v.id)) out.push(indexToVerse(v))
  }
  return out
}

// ─── Per-word search: morphology & Strong's number ────────────────────────────

// Every word grouped by verse, each as [strongs, lemmaNorm, parsingLower]. Two files with the
// same shape: word-index.json.gz for the New Testament (scripts/build-word-index.mjs, from the
// parsing trees) and word-index-lxx.json.gz for the Septuagint (scripts/build-word-index-lxx.mjs,
// from our own Stanza tagging of Swete).
//
// The Septuagint one is loaded only when a search asks for it. It is four times the size of the
// New Testament's — 576,000 words against 138,000 — and most searches never leave the New
// Testament, so making every cold start pay for it would be a poor trade.
//
// Morphology search over the Septuagint was impossible before this: the Rahlfs data carried no
// usable parse, its `lemma` field holding the inflected surface form rather than a dictionary
// form. Asking for it returned nothing, silently, because the verse ids in the index were all
// New Testament and filtering them by corpus left the empty set.
type WordRow = [string, string, string]          // [strongs, lemmaNorm, parsingLower]
type WordIndex = Record<string, WordRow[]>       // verseId → words
const _wordIndexes: Partial<Record<'GNT' | 'LXX', WordIndex>> = {}

function getWordIndex(which: 'GNT' | 'LXX' = 'GNT'): WordIndex {
  const cached = _wordIndexes[which]
  if (cached) return cached
  const name = which === 'LXX' ? 'word-index-lxx.json.gz' : 'word-index.json.gz'
  let loaded: WordIndex
  try {
    loaded = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(process.cwd(), 'public', 'data', name))).toString('utf8'))
  } catch {
    loaded = {}
  }
  _wordIndexes[which] = loaded
  return loaded
}

/** Which per-word indexes a search over this corpus has to scan. */
function wordIndexesFor(corpus: SearchCorpus): WordIndex[] {
  if (corpus === 'LXX') return [getWordIndex('LXX')]
  if (corpus === 'GNT') return [getWordIndex('GNT')]
  return [getWordIndex('GNT'), getWordIndex('LXX')]
}

// Collect the matched verse ids in canonical order (via the main index) and apply the
// corpus filter. Shared by the morphology and Strong's searches below.
function versesFor(matched: Set<string>, corpus: SearchCorpus): BiblicalVerse[] {
  const out: BiblicalVerse[] = []
  for (const v of getIndex()) {
    if ((corpus === 'BOTH' || v.corpus === corpus) && matched.has(v.id)) out.push(indexToVerse(v))
  }
  return out
}

// Verse text for a set of verse ids. Construct search (construct-search.ts) matches on its own
// flat token index and already returns hits in canonical order, so it needs the display text
// back rather than a re-ordered verse list.
export function verseTextsByIds(ids: Iterable<string>): Map<string, string> {
  const want = ids instanceof Set ? ids : new Set(ids)
  const out = new Map<string, string>()
  for (const v of getIndex()) if (want.has(v.id)) out.set(v.id, v.text)
  return out
}

export interface MorphCriteria {
  features: string[]     // lowercased parsing tokens that must ALL be present, e.g. ['verb','aorist','participle']
  lemma?: string         // optional: also require this lexeme (any inflected form)
}

// Every verse containing a word whose parsing matches all requested features (and, if
// given, the requested lemma). Feature tokens are matched against the word's parsing
// string, e.g. 'verb, aorist, active, participle, …'.
export async function searchByMorph(criteria: MorphCriteria, corpus: SearchCorpus): Promise<(BiblicalVerse & { matchedLemmas?: string[] })[]> {
  const feats = criteria.features.map(f => f.toLowerCase().trim()).filter(Boolean)
  const lemmaNorm = criteria.lemma ? normalizeGreek(criteria.lemma) : null
  if (!feats.length && !lemmaNorm) return []
  // verseId → normalized lemmas of the words that matched, so the results view can
  // red-highlight exactly the matching token(s) in each verse.
  const matched = new Map<string, Set<string>>()
  for (const wi of wordIndexesFor(corpus)) for (const verseId in wi) {
    for (const [, l, p] of wi[verseId]) {
      if (lemmaNorm && l !== lemmaNorm) continue
      const toks = p ? p.split(', ') : []
      if (feats.every(f => toks.includes(f))) {
        let set = matched.get(verseId)
        if (!set) matched.set(verseId, (set = new Set()))
        if (l) set.add(l)
      }
    }
  }
  return versesFor(new Set(matched.keys()), corpus)
    .map(v => ({ ...v, matchedLemmas: Array.from(matched.get(v.id) ?? []) }))
}

// Every verse containing a word with the given Strong's number (e.g. '1080' or 'G1080').
export async function searchByStrongs(strongs: string, corpus: SearchCorpus): Promise<BiblicalVerse[]> {
  const s = String(strongs).replace(/^g/i, '').trim()
  if (!s) return []
  const matched = new Set<string>()
  for (const wi of wordIndexesFor(corpus)) for (const verseId in wi) {
    if (wi[verseId].some(w => w[0] === s)) matched.add(verseId)
  }
  return versesFor(matched, corpus)
}

// ─── Hebrew (Masoretic Text) search ───────────────────────────────────────────

// hebrew-search-index.json.gz (scripts/build-hebrew-search-index.mjs): one entry per MT verse
// with the pointed text (for display + surface search) and the distinct Strong's numbers in it
// (for "all forms"). Loaded once and cached, like the Greek index.
interface HebIndexVerse { id: string; bookId: string; chapter: number; verse: number; reference: string; text: string; strongs: string[]; ws?: string[] }
let _hebIndex: HebIndexVerse[] | null = null
let _hebNorm: string[] | null = null

// The Hebrew fold lives in hebrew-fold.ts (client-safe) so the search-results highlighter
// marks exactly what this index matched; re-exported here for existing importers.
import { normalizeHebrew } from './hebrew-fold'
export { normalizeHebrew }

function getHebIndex(): HebIndexVerse[] {
  if (_hebIndex) return _hebIndex
  const file = path.join(process.cwd(), 'public', 'data', 'hebrew-search-index.json.gz')
  try {
    _hebIndex = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'))
  } catch {
    _hebIndex = []
  }
  return _hebIndex!
}
function getHebNorm(): string[] {
  if (_hebNorm) return _hebNorm
  _hebNorm = getHebIndex().map(v => normalizeHebrew(v.text))
  return _hebNorm
}
function hebToVerse(v: HebIndexVerse): BiblicalVerse {
  return { id: v.id, bookId: v.bookId, chapter: v.chapter, verse: v.verse, reference: v.reference, text: v.text }
}

// Every MT verse containing the given Strong's number (e.g. 'H430', '430') — the "all forms"
// search, since one Strong's number covers all inflections of a Hebrew lexeme. Each hit also
// carries the matched word SURFACES (`matchWords`) so the results pane can highlight the
// inflected forms: the index's `ws` is per-word Strong's aligned with text.split(/[\s־]+/).
export async function searchHebrewByStrongs(strongs: string): Promise<(BiblicalVerse & { matchWords?: string[] })[]> {
  const s = String(strongs).replace(/[^0-9]/g, '')
  if (!s) return []
  return getHebIndex().filter(v => v.strongs.includes(s)).map(v => {
    const parts = v.text.split(/[\s־]+/).filter(Boolean)
    const matchWords = v.ws ? Array.from(new Set(parts.filter((_, i) => v.ws![i] === s))) : undefined
    return { ...hebToVerse(v), ...(matchWords && matchWords.length ? { matchWords } : {}) }
  })
}

// MT verses containing a given Strong's number, with per-word Strong's (`ws`) aligned to
// text.split(/[\s־]+/) — so /api/vocab-sentence can mark which words are the target form.
export function hebrewVersesByStrongs(strongs: string): { reference: string; text: string; ws: string[]; bookId: string; chapter: number; verse: number }[] {
  const s = String(strongs).replace(/[^0-9]/g, '')
  if (!s) return []
  return getHebIndex()
    .filter(v => (v.ws ?? []).includes(s))
    .map(v => ({ reference: v.reference, text: v.text, ws: v.ws ?? [], bookId: v.bookId, chapter: v.chapter, verse: v.verse }))
}

// Every MT verse whose text contains the given form — the "this form" search, cantillation-
// insensitive so it isn't defeated by differing accent marks.
export async function searchHebrewBySurface(query: string): Promise<BiblicalVerse[]> {
  const q = normalizeHebrew(query)
  if (!q) return []
  const norm = getHebNorm()
  const idx = getHebIndex()
  const out: BiblicalVerse[] = []
  for (let i = 0; i < idx.length; i++) if (norm[i].includes(q)) out.push(hebToVerse(idx[i]))
  return out
}

// ─── Hebrew suggestions ───────────────────────────────────────────────────────
// Dictionary suggestions for a typed Hebrew prefix (the parallel of suggestGreekLexemes):
// pointed lemmas from the Hebrew lexicon, matched on the consonantal fold and ordered by
// corpus frequency (counted from the verse index's per-word Strong's). Each suggestion
// carries its Strong's number so a pick can run the "all forms" search.
interface HebLemmaEntry { l: string; g: string; n: string; k: string; s: string; f: number }

// The vowel-letters, for the fuzzy second pass below. A reader typing Hebrew phonetically
// through the Latin transliteration gets א ה ו י ע standing in for the vowels ("melek" →
// מעלעך), which prefix-matches nothing: the actual word is מלך. Dropping these letters
// from BOTH sides lets the sounded-out spelling find the written one. Never the first
// pass — the same letters are real consonants in countless words (שאול, עיר) and exact
// matches must always win.
const HEB_MATRES = /[אהויע]/g
const hebSkeleton = (n: string) => n.replace(HEB_MATRES, '')
let _hebLemmas: HebLemmaEntry[] | null = null
function getHebLemmaIndex(): HebLemmaEntry[] {
  if (_hebLemmas) return _hebLemmas
  const freq = new Map<string, number>()
  for (const v of getHebIndex()) for (const s of v.ws ?? []) if (s) freq.set(s, (freq.get(s) ?? 0) + 1)
  let lex: Record<string, { lemma?: string; gloss?: string }> = {}
  try {
    lex = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'hebrew-lexicon.json'), 'utf8'))
  } catch { /* no lexicon → no suggestions */ }
  const out: HebLemmaEntry[] = []
  for (const [s, e] of Object.entries(lex)) {
    const f = freq.get(s) ?? 0
    if (!e.lemma || f === 0) continue          // not attested in the MT corpus
    const n = normalizeHebrew(e.lemma)
    out.push({ l: e.lemma, g: e.gloss ?? '', n, k: hebSkeleton(n), s, f })
  }
  out.sort((a, b) => b.f - a.f)
  _hebLemmas = out
  return out
}
export function suggestHebrewLexemes(prefix: string, limit = 12): { word: string; sub: string; strongs: string }[] {
  const p = normalizeHebrew(prefix)
  if (!p) return []
  const out: { word: string; sub: string; strongs: string }[] = []
  for (const e of getHebLemmaIndex()) {          // pre-sorted by frequency
    if (!e.n.startsWith(p)) continue
    if (out.some(x => x.word === e.l && x.sub === e.g)) continue   // exact duplicate entry
    out.push({ word: e.l, sub: e.g, strongs: e.s })
    if (out.length >= limit) break
  }
  // Fuzzy second pass, only when exact prefixes found nothing: match with the
  // vowel-letters dropped from both sides, so a phonetically typed word ("melek" →
  // מעלעך) still reaches its written form (מלך). See HEB_MATRES.
  if (out.length === 0) {
    const pk = hebSkeleton(p)
    if (pk.length >= 2) {
      for (const e of getHebLemmaIndex()) {
        if (!e.k.startsWith(pk)) continue
        if (out.some(x => x.word === e.l && x.sub === e.g)) continue
        out.push({ word: e.l, sub: e.g, strongs: e.s })
        if (out.length >= limit) break
      }
    }
  }
  return out
}

// ─── Lexicon search (still DB-backed — lexical entries are small) ─────────────

export async function searchLexicon(query: string, limit = 20) {
  return prisma.lexicalEntry.findMany({
    where: {
      OR: [
        { lexeme:   { contains: query, mode: 'insensitive' } },
        { gloss:    { contains: query, mode: 'insensitive' } },
        { strongs:  { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { frequency: 'desc' },
    take: limit,
  })
}
