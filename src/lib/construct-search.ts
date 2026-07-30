// Construct search engine — "find an aorist participle within 4 words of a dative noun".
// Server-only: reads public/data/construct-index.json.gz (scripts/build-construct-index.mjs),
// a flat per-book token stream with verse offsets, cached in-process like the other indexes.
//
// GNT only in this pass. The LXX chapter files already carry full morphology, so a second
// index can be added without touching this file's matching logic.

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { normalizeGreek } from './greek-utils'
import { termIsEmpty, type ConstructQuery, type ConstructTerm } from './construct-query'

// [strongs, lemmaNorm, parsingLower] — the parsing is a ', '-joined token list, e.g.
// 'verb, aorist, active, participle, nominative, masculine, singular'.
type TokenRow = [string, string, string]
interface BookIndex {
  w: TokenRow[]
  v: [number, number, number][]   // [chapter, verse, startIndex], ascending by startIndex
}
interface ConstructIndex { version: number; books: Record<string, BookIndex> }

let _index: ConstructIndex | null = null

function getIndex(): ConstructIndex {
  if (_index) return _index
  const file = path.join(process.cwd(), 'public', 'data', 'construct-index.json.gz')
  try {
    _index = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')) as ConstructIndex
  } catch {
    _index = { version: 0, books: {} }
  }
  return _index!
}

// ─── Term matching ────────────────────────────────────────────────────────────

// A compiled term: every category is an OR-set, and all categories must be satisfied (AND).
interface CompiledTerm {
  groups: string[][]
  lemma: string | null
}

function compile(term: ConstructTerm): CompiledTerm {
  return {
    groups: Object.values(term.features).map(vals => vals.map(v => v.toLowerCase().trim()).filter(Boolean)).filter(g => g.length > 0),
    lemma: term.lemma ? normalizeGreek(term.lemma) : null,
  }
}

function tokenMatches(tok: TokenRow, t: CompiledTerm): boolean {
  if (t.lemma && tok[1] !== t.lemma) return false
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
// Returns the matched token positions for each hit (used to highlight, and to locate the verse).

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
    if (termIdx === n) { hits.push(chosen.slice().sort((a, b) => a - b)); return }
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

export function searchConstruct(query: ConstructQuery, limit = 300): { hits: ConstructHit[]; truncated: boolean } {
  const terms = query.terms.filter(t => !termIsEmpty(t)).map(compile)
  if (terms.length < 2) return { hits: [], truncated: false }

  const within = Math.max(1, query.within)
  const bookFilter = query.books?.length ? new Set(query.books) : null
  const idx = getIndex()
  const hits: ConstructHit[] = []
  let truncated = false

  // Books are stored in canonical order, so iterating the object yields reading order.
  for (const [osisId, book] of Object.entries(idx.books)) {
    if (bookFilter && !bookFilter.has(osisId)) continue

    // Positions per term, ascending.
    const positions: number[][] = terms.map(() => [])
    for (let i = 0; i < book.w.length; i++) {
      const tok = book.w[i]
      for (let t = 0; t < terms.length; t++) if (tokenMatches(tok, terms[t])) positions[t].push(i)
    }
    if (positions.some(p => p.length === 0)) continue

    const raw = findMatches(positions, within, query.ordered)

    // Collapse to one hit per verse (the verse of the first matched word), unioning the
    // matched lemmas so every participating word in that verse gets highlighted.
    const perVerse = new Map<string, ConstructHit>()
    for (const group of raw) {
      const [ch, vs] = verseAt(book, group[0])
      const last = verseAt(book, group[group.length - 1])
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
