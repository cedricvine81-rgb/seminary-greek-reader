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

// [strongs, lemmaNorm, parsingLower] — the parsing is a ', '-joined token list, e.g.
// 'verb, aorist, active, participle, nominative, masculine, singular'.
type TokenRow = [string, string, string]
interface BookIndex {
  w: TokenRow[]
  v: [number, number, number][]   // [chapter, verse, startIndex], ascending by startIndex
}
// Books per corpus, each in canonical order (the engine relies on that for reading-order hits).
interface ConstructIndex { version: number; corpora: Record<string, Record<string, BookIndex>> }

let _index: ConstructIndex | null = null

function getIndex(): ConstructIndex {
  if (_index) return _index
  const file = path.join(process.cwd(), 'public', 'data', 'construct-index.json.gz')
  try {
    _index = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')) as ConstructIndex
  } catch {
    _index = { version: 0, corpora: {} }
  }
  return _index!
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
  // True when at least one match in this verse straddles a verse boundary (a verse can hold
  // both kinds) — worth flagging in the results, since the second word is in the next verse.
  crossesVerse: boolean
}

// Locate a token position's verse via the book's ascending verse-offset table.
function verseAt(book: BookIndex, pos: number): [number, number, number] {
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

export function searchConstruct(query: ConstructQuery, limit = 300): { hits: ConstructHit[]; truncated: boolean } {
  // Keep each usable term's ORIGINAL index: `agreeWith` refers to "Word N" as the user numbered
  // them, which is not the position in this filtered list.
  const usable = query.terms
    .map((t, i) => ({ term: t, index: i }))
    .filter(({ term }) => !termIsEmpty(term))
  // Positive terms drive the positioning; negated ones only forbid.
  const positive = usable.filter(u => !u.term.negate)
  const negative = usable.filter(u => u.term.negate).map(u => compile(u.term))
  if (positive.length < 2) return { hits: [], truncated: false }

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
  const idx = getIndex()
  const hits: ConstructHit[] = []
  let truncated = false

  // Books are stored in canonical order, so iterating the object yields reading order.
  for (const [osisId, book] of Object.entries(idx.corpora[query.corpus] ?? {})) {
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
      if (!hit) perVerse.set(verseId, (hit = { verseId, bookId: osisId, chapter: ch, verse: vs, matchedLemmas: [], crossesVerse }))
      hit.crossesVerse = hit.crossesVerse || crossesVerse
      for (const p of group) {
        const lemma = book.w[p][1]
        if (lemma && !hit.matchedLemmas.includes(lemma)) hit.matchedLemmas.push(lemma)
      }
    }

    // Verse order within the book (the map is keyed by id, filled in position order already,
    // but a cross-verse match can seed a later verse first — sort to be safe).
    const inBook = Array.from(perVerse.values()).sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)
    for (const h of inBook) {
      if (hits.length >= limit) { truncated = true; break }
      hits.push(h)
    }
    if (truncated) break
  }

  return { hits, truncated }
}
