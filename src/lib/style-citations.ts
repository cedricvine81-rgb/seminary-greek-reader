// Server-only: where in the text a shared trait actually occurs.
//
// The printed report claims that two works share a habit — "both are far above the library's
// average for aorists" — and a claim like that is only worth as much as the references behind
// it. This turns a feature key back into a list of places a reader can look up.
//
// It reuses construct search's corpus cache and the same feature definitions the rates were
// counted with, so a citation cannot point at something the count did not count.

import { getCorpusIndex, type BookIndex } from './construct-search'
import { RATE_FEATURES, constructionIndices, canonLemma, type Word } from './style-features'
import type { PassageRef } from './style-passage'

/** Which unit to cite: a whole work, or the passage a reader profiled. */
export type CitationTarget =
  | { kind: 'work'; corpus: string; work: string }
  | { kind: 'passage'; ref: PassageRef }

/**
 * Turn a word's position into a reference a reader can look up.
 *
 * The four shapes were measured across the corpora rather than assumed, because they disagree
 * and a wrong citation in a printed document is worse than none:
 *
 *   Luke                              a biblical book — the verse table is chapter:verse
 *   josephus/antiquities/3            the verse table's FIRST field is already the book number
 *                                     (Antiquities book 3 opens [3, 1, 0]), so it reads 3.1
 *   greco/herodotus-histories-4       chapters RESTART at 1 in every book, so the book number
 *                                     survives only in the key's trailing -N
 *   philo/abraham                     one file, one sequence: section numbers alone
 *
 * Only the numerals are returned. The work is named by the table the reference sits in, so
 * repeating it per row would be noise — and it keeps this function out of the business of
 * abbreviating titles, which is the one part it could get subtly wrong.
 */
function referenceFor(bookKey: string, chapter: number, verse: number): string {
  const parts = bookKey.split('/')
  if (parts.length === 1) return `${chapter}:${verse}`                       // biblical
  if (parts.length >= 3 && /^\d+$/.test(parts[parts.length - 1])) {
    return `${chapter}.${verse}`                                            // book already in v
  }
  const trailing = /-(\d+)$/.exec(parts[parts.length - 1])
  if (trailing) return `${trailing[1]}.${chapter}.${verse}`                  // book only in the key
  return `${chapter}.${verse}`                                              // single-sequence work
}

/** The verse a word index falls in. The table is ascending by start, so a walk suffices. */
function refAt(book: BookIndex, bookKey: string, index: number, flat: boolean): string | null {
  const v = book.v
  let lo = 0, hi = v.length - 1, hit = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (v[mid][2] <= index) { hit = mid; lo = mid + 1 } else { hi = mid - 1 }
  }
  if (hit < 0) return null
  // A work numbered in one flat sequence (Philo's sections, and the prose works generally)
  // carries a constant 1 in the chapter field; printing "1.204" for §204 would invent a
  // division the edition does not have.
  return flat ? String(v[hit][1]) : referenceFor(bookKey, v[hit][0], v[hit][1])
}

/**
 * Book keys belonging to one work, IN READING ORDER.
 *
 * The index's own key order is the object's, which is lexical: Antiquities book 10 sits between
 * 1 and 2. Citations sampled across that order come out shuffled — "1.9, 16.340, 2.276" — which
 * reads as a bug in a printed reference list even though every reference is correct.
 */
function booksOf(corpus: string, work: string): string[] {
  const index = getCorpusIndex(corpus)
  const workOf = (key: string) => {
    const parts = key.split('/')
    if (parts.length >= 3) return parts.slice(0, -1).join('/')
    return key.replace(/-\d+$/, '')
  }
  const num = (key: string) => {
    const m = /(?:\/|-)(\d+)$/.exec(key)
    return m ? Number(m[1]) : 0
  }
  return Object.keys(index)
    .filter(k => workOf(k) === work)
    .sort((a, b) => num(a) - num(b) || a.localeCompare(b))
}

/** True when the book's verse table never leaves chapter 1 — one flat run of sections. */
function isFlat(book: BookIndex, bookKey: string): boolean {
  if (!bookKey.includes('/')) return false          // biblical books are always chapter:verse
  if (/(?:\/|-)\d+$/.test(bookKey)) return false     // the key names a book; keep its numbering
  for (const row of book.v) if (row[0] !== 1) return false
  return true
}

const RATE_TEST = new Map(RATE_FEATURES.map(f => [f.key, f.test]))

/**
 * Up to `limit` references per requested key, spread across the text rather than taken from
 * the opening — three citations all from chapter 1 would misrepresent a habit that runs
 * throughout, and would look like it.
 */
function sample<T>(all: T[], limit: number): T[] {
  if (all.length <= limit) return all
  const step = all.length / limit
  return Array.from({ length: limit }, (_, i) => all[Math.floor(i * step)])
}

export interface Citations {
  /** feature or lemma key → references, in reading order. Empty means the trait is absent. */
  refs: Record<string, string[]>
  /** Total occurrences found, before sampling — "3 of 47" is different from "3 of 3". */
  counts: Record<string, number>
}

/**
 * Find where each requested trait occurs. `features` are feature keys (aorist, genAbs, …) and
 * `lemmas` are canonical lemmas (και, δε, …); both are answered in one pass over the words.
 */
export function citationsFor(
  target: CitationTarget, features: string[], lemmas: string[], limit = 3,
): Citations {
  const wanted = Array.from(new Set(features))
  const wantedLemmas = Array.from(new Set(lemmas.map(canonLemma)))
  const lemmaSet = new Set(wantedLemmas)
  const featureSet = new Set(wanted)
  const found: Record<string, string[]> = {}
  const counts: Record<string, number> = {}
  const push = (key: string, ref: string | null) => {
    if (!ref) return
    ;(found[key] ??= []).push(ref)
    counts[key] = (counts[key] ?? 0) + 1
  }

  const scan = (corpus: string, bookKey: string, words: Word[], offset: number) => {
    const book = getCorpusIndex(corpus)[bookKey]
    if (!book) return
    const flat = isFlat(book, bookKey)
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      const lemma = canonLemma(w[1])
      if (lemmaSet.has(lemma)) push(lemma, refAt(book, bookKey, i + offset, flat))
      for (const key of wanted) {
        const test = RATE_TEST.get(key)
        if (test && test([w[0], lemma, w[2], w[3]])) push(key, refAt(book, bookKey, i + offset, flat))
      }
    }
    // The multi-word constructions, from the same walk that counts them.
    const at = constructionIndices(words)
    for (const key of Object.keys(at)) {
      if (!featureSet.has(key)) continue
      for (const i of at[key]) push(key, refAt(book, bookKey, i + offset, flat))
    }
  }

  if (target.kind === 'work') {
    const index = getCorpusIndex(target.corpus)
    for (const bookKey of booksOf(target.corpus, target.work)) {
      scan(target.corpus, bookKey, index[bookKey].w as Word[], 0)
    }
  } else {
    const { corpus, book: bookKey, fromCh, fromV, toCh, toV } = target.ref
    const book = getCorpusIndex(corpus)[bookKey]
    if (book) {
      // Slice to the requested range — VERSES included, with the same bounds the passage
      // profiler uses. Chapter-only slicing here once cited "Mark 4:39" as evidence for a
      // comparison of Mark 4:1-9: every reference was real and some were outside the passage,
      // which in a printed document is worse than none.
      const v = book.v
      const lower = (c: number, vv: number) =>
        c > fromCh || (c === fromCh && (fromV === undefined || vv >= fromV))
      const upper = (c: number, vv: number) =>
        c > toCh || (c === toCh && toV !== undefined && vv > toV)
      let start = book.w.length, end = book.w.length
      for (let i = 0; i < v.length; i++) {
        const [c, vv, at] = v[i]
        if (start === book.w.length && lower(c, vv)) start = at
        if (start !== book.w.length && upper(c, vv)) { end = at; break }
      }
      if (start < end) scan(corpus, bookKey, book.w.slice(start, end) as Word[], start)
    }
  }

  const refs: Record<string, string[]> = {}
  for (const key of wanted.concat(wantedLemmas)) refs[key] = sample(found[key] ?? [], limit)
  return { refs, counts }
}
