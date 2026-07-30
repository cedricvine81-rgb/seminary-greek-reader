// Construct search engine — "find an aorist participle within 4 words of a dative noun".
// Server-only: reads public/data/construct-index.json.gz (scripts/build-construct-index.mjs),
// a flat per-book token stream with verse offsets, cached in-process like the other indexes.
//
// Covers both corpora (New Testament and Septuagint), one per search — see ConstructCorpus.
// Beyond positioning, a term can require AGREEMENT with another word in case/number/gender, or be
// NEGATED so the construct only matches where no such word stands between the others.

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { normalizeGreek } from './greek-utils'
import { termIsEmpty, type ConstructQuery, type ConstructTerm } from './construct-query'
import { CATEGORY_OF_TOKEN } from './morph-features'
import { lemmaEntry } from './construct-lemmas'
import { CONSTRUCT_CORPORA } from './construct-query'

// [strongs, lemmaNorm, parsingLower] — the parsing is a ', '-joined token list, e.g.
// 'verb, aorist, active, participle, nominative, masculine, singular'.
type TokenRow = [string, string, string]
interface BookIndex {
  w: TokenRow[]
  // [chapter, verse, startIndex, aligned?] — ascending by startIndex. `aligned` is present only for
  // the GNT, where the index's edition and the reader's differ in about 9% of verses; 1 means this
  // verse's words can be marked by position, 0 that they can't. See build-construct-index.mjs.
  v: [number, number, number, number?][]
}
// Books of ONE corpus, in canonical order (the engine relies on that for reading-order hits).
type CorpusIndex = Record<string, BookIndex>

// One file per corpus, loaded on demand and kept in a size-bounded cache. Deliberately not one
// combined file: the nine corpora come to 160 MB of parsed JSON, far too much to pull in on a cold
// start just to search one text.
//
// The cache is bounded rather than unlimited, and least-recently-used rather than cleared: measured
// in production, RELEASING each corpus after use made "search all" re-parse all nine on every
// request — a flat 6.8-7.6s, uncomfortably near Vercel's function limit — while keeping all nine
// costs 557 MB of heap. Holding the ~2 largest covers the common cases (repeat searches, and the
// expensive tail of a cross-corpus search) inside a budget that leaves room to work in.
// Budgeted in JSON TEXT, which is what we can measure cheaply — the parsed object graph runs about
// 3.5x that (160 MB of text became 557 MB of heap), so this holds roughly one large corpus plus a
// small one, ~150 MB of actual heap. Cross-corpus searches no longer rely on this: they run one
// request per corpus, so an instance normally touches one.
const CACHE_BUDGET_BYTES = 40 * 1024 * 1024

interface CachedCorpus { index: CorpusIndex; bytes: number; used: number }
const _corpora = new Map<string, CachedCorpus>()
let _clock = 0

function evictTo(budget: number): void {
  let total = 0
  _corpora.forEach(c => { total += c.bytes })
  while (total > budget && _corpora.size > 1) {
    let oldest: string | null = null
    let oldestUsed = Infinity
    _corpora.forEach((c, k) => { if (c.used < oldestUsed) { oldestUsed = c.used; oldest = k } })
    if (!oldest) break
    total -= _corpora.get(oldest)!.bytes
    _corpora.delete(oldest)
  }
}

function getCorpus(corpus: string): CorpusIndex {
  const hit = _corpora.get(corpus)
  if (hit) { hit.used = ++_clock; return hit.index }
  const file = path.join(process.cwd(), 'public', 'data', 'construct', `${corpus}.json.gz`)
  let index: CorpusIndex = {}
  let bytes = 0
  try {
    const raw = zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')
    bytes = raw.length
    index = JSON.parse(raw) as CorpusIndex
  } catch {
    index = {}
  }
  _corpora.set(corpus, { index, bytes, used: ++_clock })
  evictTo(CACHE_BUDGET_BYTES)
  return index
}

// ─── Term matching ────────────────────────────────────────────────────────────

// A compiled term: every category is an OR-set, and all categories must be satisfied (AND).
interface CompiledTerm {
  groups: string[][]
  lemma: string | null
  strongs: Set<string> | null
}

function compile(term: ConstructTerm): CompiledTerm {
  return {
    groups: Object.values(term.features).map(vals => vals.map(v => v.toLowerCase().trim()).filter(Boolean)).filter(g => g.length > 0),
    lemma: term.lemma ? normalizeGreek(term.lemma) : null,
    strongs: term.strongs?.length ? new Set(term.strongs.map(String)) : null,
  }
}

function tokenMatches(tok: TokenRow, t: CompiledTerm): boolean {
  // Strong's wins when present: it identifies the lexeme even where the corpus's own lemma field
  // is just the surface form (the LXX), so it matches every inflected form rather than one
  // spelling. Falls back to the lemma string, which is what the GNT trees actually carry.
  if (t.strongs) { if (!t.strongs.has(tok[0])) return false }
  else if (t.lemma && tok[1] !== t.lemma) return false
  if (t.groups.length === 0) return true
  const parsing = tok[2]
  if (!parsing) return false
  const toks = parsing.split(', ')
  // Every category must contribute one of its alternatives.
  return t.groups.every(alts => alts.some(a => toks.includes(a)))
}

// ─── Proximity ────────────────────────────────────────────────────────────────

// Distances are in words: adjacent tokens are 1 apart, so `within` is a gap, not a span count.
// One rule for both modes — every matched word falls inside a window of `within`, i.e.
// max − min ≤ within — and "in order" additionally requires the positions to increase. That
// makes ordered a strict SUBSET of unordered, and reads the way the UI says it ("within N words
// of each other"). A word can never fill two terms at once.
//
// Enumeration must be exhaustive, not just minimal windows: a construct may straddle a verse
// boundary, and a hit is filed under the verse of its FIRST word, so a wider-but-still-legal
// pairing can land in an earlier verse than a tighter one. Missing those loses whole verses.
//
// Returns one entry per match, holding each TERM's position in term order (not sorted) — agreement
// has to know which word is which. Use spanOf() for the extent.

// Lowest and highest position in a match.
function spanOf(group: number[]): [number, number] {
  let lo = group[0], hi = group[0]
  for (const p of group) { if (p < lo) lo = p; if (p > hi) hi = p }
  return [lo, hi]
}

// Index of the first entry in `arr` (ascending) that is >= `min`.
function lowerBound(arr: number[], min: number): number {
  let lo = 0, hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < min) lo = mid + 1; else hi = mid
  }
  return lo
}

function findMatches(positions: number[][], within: number, ordered: boolean): number[][] {
  const n = positions.length
  const hits: number[][] = []
  const chosen = new Array<number>(n)

  // Depth-first over the terms. Each step binary-searches into the next term's positions
  // rather than rescanning from the front — with two very common parts of speech (article +
  // noun) a naive scan is O(n·m).
  const walk = (termIdx: number, mn: number, mx: number) => {
    if (termIdx === n) { hits.push(chosen.slice()); return }   // slot order, NOT sorted
    const list = positions[termIdx]
    // Any candidate must keep the whole span within `within`; ordered also forces it past
    // the previous pick.
    const floor = ordered ? Math.max(chosen[termIdx - 1] + 1, mx - within) : mx - within
    for (let i = lowerBound(list, floor); i < list.length; i++) {
      const p = list[i]
      if (p > mn + within) break                 // ascending → no later one fits either
      // Distinct words per term (ordered mode gets this free from the increasing floor).
      if (!ordered) {
        let clash = false
        for (let k = 0; k < termIdx; k++) if (chosen[k] === p) { clash = true; break }
        if (clash) continue
      }
      chosen[termIdx] = p
      walk(termIdx + 1, p < mn ? p : mn, p > mx ? p : mx)
    }
  }
  for (const p0 of positions[0]) { chosen[0] = p0; walk(1, p0, p0) }
  return hits
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface ConstructHit {
  verseId: string          // '<osisId>.<chapter>.<verse>' of the FIRST matched word
  bookId: string
  chapter: number
  verse: number
  // Normalized lemmas of the matched words, so the results view red-highlights them
  // (same contract as searchByMorph's matchedLemmas).
  matchedLemmas: string[]
  // 0-based indices of the matched words WITHIN this verse. The prose corpora's sidecars are
  // token-aligned with their text (verified: whitespace-splitting the verse yields exactly the
  // sidecar's word count), so those results can mark the actual matched words rather than every
  // occurrence of their lemma. Words from a match's other verse are naturally absent.
  matchedWords: number[]
  // Whether those indices may be trusted against the text the reader renders — false for a GNT
  // verse whose editions disagree, where marking by position would mark the wrong words.
  aligned: boolean
  // True when at least one match in this verse straddles a verse boundary (a verse can hold
  // both kinds) — worth flagging in the results, since the second word is in the next verse.
  crossesVerse: boolean
}

// Locate a token position's verse via the book's ascending verse-offset table.
function verseAt(book: BookIndex, pos: number): [number, number, number, number?] {
  let lo = 0, hi = book.v.length - 1, best = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (book.v[mid][2] <= pos) { best = mid; lo = mid + 1 } else { hi = mid - 1 }
  }
  return book.v[best]
}

// The value a token carries in a category ('genitive' for 'case'), or null if it has none.
function valueIn(tok: TokenRow, category: string): string | null {
  const parsing = tok[2]
  if (!parsing) return null
  for (const t of parsing.split(', ')) if (CATEGORY_OF_TOKEN.get(t) === category) return t
  return null
}

// A term's Strong's numbers are only meaningful for the corpus they were looked up in — the client
// holds one corpus's table at a time, and "search all" has no single table at all. So a term naming
// a word is re-resolved here against the corpus actually being searched: the Septuagint matches by
// number (its `lemma` field is only a surface form), everything else by lemma string. Without this,
// a lexeme search would silently return nothing from whichever corpus disagreed.
function resolveTerms(corpus: string, terms: ConstructTerm[]): ConstructTerm[] {
  return terms.map(t => {
    if (!t.lemma) return t
    const entry = lemmaEntry(corpus, t.lemma)
    const numbers = entry?.s as unknown as string[] | undefined
    if (numbers?.length) return { ...t, strongs: numbers }
    const { strongs: _drop, ...rest } = t
    return rest
  })
}

// `total` is the TRUE number of matching verses; `hits` is capped at `limit`. Counting past the cap
// costs a full scan of the corpus (~600ms for the largest), which is worth paying: "300+" told the
// reader nothing, and it contradicted the per-corpus totals in the cross-corpus view.
export function searchConstruct(query: ConstructQuery, limit = 300): { hits: ConstructHit[]; total: number; truncated: boolean } {
  // Keep each usable term's ORIGINAL index: `agreeWith` refers to "Word N" as the user numbered
  // them, which is not the position in this filtered list.
  const usable = resolveTerms(query.corpus, query.terms)
    .map((t, i) => ({ term: t, index: i }))
    .filter(({ term }) => !termIsEmpty(term))
  // Positive terms drive the positioning; negated ones only forbid.
  const positive = usable.filter(u => !u.term.negate)
  const negative = usable.filter(u => u.term.negate).map(u => compile(u.term))
  if (positive.length < 2) return { hits: [], total: 0, truncated: false }

  const terms = positive.map(u => compile(u.term))
  // Agreement, resolved onto positions within the positive list.
  const slotOfOriginal = new Map(positive.map((u, slot) => [u.index, slot]))
  const agreements = positive
    .map((u, slot) => {
      const other = u.term.agreeWith !== undefined ? slotOfOriginal.get(u.term.agreeWith) : undefined
      const cats = (u.term.agreeOn ?? []).filter(Boolean)
      // A word can't agree with itself, and agreement with a word that isn't in play is dropped
      // rather than silently failing every verse.
      return other !== undefined && other !== slot && cats.length ? { slot, other, cats } : null
    })
    .filter((a): a is { slot: number; other: number; cats: string[] } => !!a)

  const within = Math.max(1, query.within)
  const bookFilter = query.books?.length ? new Set(query.books) : null
  const books = getCorpus(query.corpus)
  const hits: ConstructHit[] = []
  let total = 0

  // Books are stored in canonical order, so iterating the object yields reading order.
  for (const [osisId, book] of Object.entries(books)) {
    if (bookFilter && !bookFilter.has(osisId)) continue

    // Positions per term, ascending.
    const positions: number[][] = terms.map(() => [])
    for (let i = 0; i < book.w.length; i++) {
      const tok = book.w[i]
      for (let t = 0; t < terms.length; t++) if (tokenMatches(tok, terms[t])) positions[t].push(i)
    }
    if (positions.some(p => p.length === 0)) continue

    let raw = findMatches(positions, within, query.ordered)

    // Agreement: both words must carry a value in the category and the values must match. A word
    // with no value there (an indeclinable, a finite verb asked for case) cannot agree, so it
    // fails rather than passing by omission.
    if (agreements.length) {
      raw = raw.filter(group => {
        const bySlot = group      // group[i] is term i's position
        return agreements.every(({ slot, other, cats }) =>
          cats.every(cat => {
            const a = valueIn(book.w[bySlot[slot]], cat)
            const b = valueIn(book.w[bySlot[other]], cat)
            return a !== null && b !== null && a === b
          }))
      })
    }

    // Negation: nothing matching a forbidden term may stand between the matched words. The span is
    // inclusive of the endpoints, but the endpoints are themselves matched words, so in practice
    // this reads as "with no such word in between".
    if (negative.length) {
      raw = raw.filter(group => {
        const [lo, hi] = spanOf(group)
        for (let i = lo + 1; i < hi; i++) {
          for (const neg of negative) if (tokenMatches(book.w[i], neg)) return false
        }
        return true
      })
    }

    // Collapse to one hit per verse (the verse of the first matched word), unioning the
    // matched lemmas so every participating word in that verse gets highlighted.
    const perVerse = new Map<string, ConstructHit>()
    for (const group of raw) {
      const [lo, hi] = spanOf(group)
      const [ch, vs] = verseAt(book, lo)
      const last = verseAt(book, hi)
      const crossesVerse = last[0] !== ch || last[1] !== vs
      if (query.sameVerse && crossesVerse) continue
      const verseId = `${osisId}.${ch}.${vs}`
      let hit = perVerse.get(verseId)
      // Absent (the LXX and the prose corpora) means always aligned: those indexes are built from
      // the very files their readers display.
      const alignedHere = verseAt(book, lo)[3] !== 0
      if (!hit) perVerse.set(verseId, (hit = { verseId, bookId: osisId, chapter: ch, verse: vs, matchedLemmas: [], matchedWords: [], aligned: alignedHere, crossesVerse }))
      hit.crossesVerse = hit.crossesVerse || crossesVerse
      const verseStart = verseAt(book, lo)[2]
      for (const p of group) {
        const lemma = book.w[p][1]
        if (lemma && !hit.matchedLemmas.includes(lemma)) hit.matchedLemmas.push(lemma)
        // Only words in THIS verse get an index; a cross-boundary partner belongs to the next one.
        const [pch, pvs] = verseAt(book, p)
        if (pch === ch && pvs === vs) {
          const idx = p - verseStart
          if (!hit.matchedWords.includes(idx)) hit.matchedWords.push(idx)
        }
      }
      hit.matchedWords.sort((a, b) => a - b)
    }

    // Verse order within the book (the map is keyed by id, filled in position order already,
    // but a cross-verse match can seed a later verse first — sort to be safe).
    const inBook = Array.from(perVerse.values()).sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)
    total += inBook.length
    // Keep scanning past the cap so `total` is a number rather than a floor; only the returned
    // sample is limited.
    for (const h of inBook) {
      if (hits.length >= limit) break
      hits.push(h)
    }
  }

  return { hits, total, truncated: total > hits.length }
}


// ─── Every corpus at once ─────────────────────────────────────────────────────
// Reported as a DISTRIBUTION — a true count per corpus plus a small sample from each — rather than
// one flat capped list. Corpora are stored in canonical order, so a flat cap would return Matthew
// through Acts and never reach Josephus or the Greco-Roman texts, leaving the impression that a
// construction is rare outside the New Testament when it may be the reverse. The counts are the
// answer to the question a cross-corpus search is actually asked: is this distinctive, or is it
// just ordinary Greek?

export interface CorpusTally {
  corpus: string
  count: number          // the TRUE total for this corpus, not the sample size
  hits: ConstructHit[]   // a sample, `sampleLimit` long
}

export function searchConstructAll(query: ConstructQuery, sampleLimit = 5): { tallies: CorpusTally[]; total: number } {
  const tallies: CorpusTally[] = []
  let total = 0
  for (const c of CONSTRUCT_CORPORA) {
    // searchConstruct counts every match regardless of the cap, so only the sample is built.
    const { hits, total: count } = searchConstruct({ ...query, corpus: c.id }, sampleLimit)
    tallies.push({ corpus: c.id, count, hits })
    total += count
  }
  return { tallies, total }
}
