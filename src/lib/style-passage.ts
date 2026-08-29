// Server-only: profile an arbitrary passage so it can be ranked against the prebuilt works.
//
// The Register tool started out comparing whole works, which is the wrong grain for the
// question a reader most wants to ask. Luke's infancy narrative and Luke's preface are not the
// same Greek; neither are Acts 1-15 and Acts 16-28. A passage is profiled here, on demand,
// rather than precomputed, because the interesting divisions are the reader's, not ours.
//
// It reuses construct search's size-bounded corpus cache rather than opening the indexes again
// — one cache per instance, and the New Testament index it usually needs is 700KB gzipped.

import fs from 'fs'
import path from 'path'
import { getCorpusIndex } from './construct-search'
import { contentVocab, deltaVector, profileWords, type Word } from './style-features'

export interface StyleIndexMeta {
  deltaWords: string[]
  norm: { mu: Record<string, number>; sd: Record<string, number> }
  spread: Record<string, number>
  reliableWords: number
  passageCorpora: string[]
}

let _meta: StyleIndexMeta | null = null
function meta(): StyleIndexMeta {
  if (!_meta) {
    const file = path.join(process.cwd(), 'public', 'data', 'style', 'meta.json')
    _meta = JSON.parse(fs.readFileSync(file, 'utf8')) as StyleIndexMeta
  }
  return _meta
}

export interface PassageRef {
  corpus: string
  book: string
  /** Inclusive chapter bounds. A verse narrows the bound within its chapter. */
  fromCh: number
  fromV?: number
  toCh: number
  toV?: number
}

export interface PassageProfile {
  n: number
  rates: Record<string, number>
  delta: number[]
  /** Content lemmas as rates per 1,000, so the vocabulary lens works on a passage too. */
  content: [string, number][]
  reliable: boolean
  /** The chapters actually covered, which may be narrower than asked if the book is shorter. */
  span: { fromCh: number; toCh: number }
}

/** "3" or "3:16" → [chapter, verse?]. Returns null on anything else. */
export function parseRefPart(s: string): [number, number | undefined] | null {
  const m = /^\s*(\d{1,3})(?::(\d{1,3}))?\s*$/.exec(s)
  if (!m) return null
  return [Number(m[1]), m[2] === undefined ? undefined : Number(m[2])]
}

/**
 * Slice a book's token stream to the requested range.
 *
 * The verse table is [chapter, verse, startIndex] ascending by startIndex, so the range is
 * found by walking it once: the first verse at or after the lower bound opens the slice, and
 * the first verse past the upper bound closes it. A bound that falls outside the book clamps
 * rather than failing — asking for "1-99" of a 16-chapter book means the whole book.
 */
function sliceWords(words: Word[], verses: [number, number, number, (number | undefined)?][],
                    ref: PassageRef): { words: Word[]; span: { fromCh: number; toCh: number } } {
  const atOrAfter = (ch: number, v: number | undefined) =>
    (c: number, vv: number) => c > ch || (c === ch && (v === undefined || vv >= v))
  const past = (ch: number, v: number | undefined) =>
    (c: number, vv: number) => c > ch || (c === ch && v !== undefined && vv > v)

  const lower = atOrAfter(ref.fromCh, ref.fromV)
  const upper = past(ref.toCh, ref.toV)

  let start = words.length
  let end = words.length
  let firstCh = ref.fromCh
  let lastCh = ref.toCh
  let seen = false
  for (let i = 0; i < verses.length; i++) {
    const [c, v, at] = verses[i]
    if (start === words.length && lower(c, v)) { start = at; firstCh = c }
    if (start !== words.length && !upper(c, v)) { lastCh = c; seen = true }
    if (start !== words.length && upper(c, v)) { end = at; break }
  }
  if (!seen) return { words: [], span: { fromCh: ref.fromCh, toCh: ref.toCh } }
  return { words: words.slice(start, end), span: { fromCh: firstCh, toCh: lastCh } }
}

/** Profile a passage. Returns null when the reference names nothing in the corpus. */
export function profilePassage(ref: PassageRef): PassageProfile | null {
  const m = meta()
  if (!m.passageCorpora.includes(ref.corpus)) return null
  const index = getCorpusIndex(ref.corpus)
  const book = index[ref.book]
  if (!book) return null

  const { words, span } = sliceWords(book.w as Word[], book.v, ref)
  if (!words.length) return null

  const p = profileWords(words)
  return {
    n: p.n,
    rates: Object.fromEntries(Object.entries(p.rates).map(([k, v]) => [k, +v.toFixed(2)])),
    delta: deltaVector(p, m.deltaWords, m.norm.mu, m.norm.sd).map(x => +x.toFixed(2)),
    content: contentVocab(p, m.deltaWords),
    reliable: p.n >= m.reliableWords,
    span,
  }
}
