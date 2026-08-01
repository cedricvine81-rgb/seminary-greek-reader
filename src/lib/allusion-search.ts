// Allusion search — rank LXX passages by how strongly they echo a set of words chosen
// from a New Testament passage. Server-only: scans the LXX construct index (shared, via
// getCorpusIndex, with the construct engine's size-bounded cache).
//
// The method follows Dale Allison's allusion devices (The New Moses, 1993):
//   device 4 (key words)        → shared vocabulary, WEIGHTED BY RARITY. Sharing a word that
//                                 appears 40× in the LXX is evidence; sharing λέγω (thousands)
//                                 is nothing. Weight = ln(totalVerses / verseCount).
//   device 2 (implicit citation)→ VERBATIM RUNS: 3+ selected-passage words appearing in the
//                                 same order in the candidate, flagged separately and scored
//                                 far above bag-of-words overlap; runs where the inflected
//                                 forms also match are marked near-verbatim.
//   device 6 (sequence)         → the same run detection at the Strong's (lemma) level.
// Devices 1, 3 and 5 (explicit statement, similar circumstances, narrative structure) are
// human judgments; the UI carries them as a checklist, not a score.
//
// Matching runs on STRONG'S NUMBERS, which the GNT and LXX indexes share — the bridge that
// works, since the LXX index has no true lemmas (folded surface forms only).

import { normalizeGreek } from './greek-utils'
import { getCorpusIndex, type BookIndex } from './construct-search'

// A word of the NT source passage, in reading order: Strong's + folded surface form.
export interface SourceToken { s: string; f: string }

export interface AllusionMatch {
  strongs: string
  form: string          // the folded form as it appears in the LXX hit (first occurrence)
  count: number         // occurrences inside the window
  exactForm: boolean    // some occurrence matches the selected NT word's inflected form
  verses: number        // LXX verse-count of this Strong's (rarity, for the UI badge)
}

export interface AllusionRun {
  length: number        // tokens in the run (Strong's-order match)
  exactForms: number    // how many of those also match the NT inflected form
  text: string          // the run as folded LXX text
  strongs: string[]     // the run's Strong's, for highlighting
}

export interface AllusionHit {
  osis: string
  chapter: number
  vStart: number
  vEnd: number
  endChapter?: number   // set when the 3-verse window crosses a chapter boundary
  score: number
  matches: AllusionMatch[]
  run?: AllusionRun
}

export interface AllusionResult {
  totalVerses: number
  hits: AllusionHit[]
  // verse-frequency of every requested Strong's — the UI's rarity badges
  frequencies: Record<string, number>
}

const CORPUS = 'LXX'
const WINDOW = 1          // verses of context either side: a 3-verse sliding window
const MAX_HITS = 40
const RUN_CANDIDATES = 200 // run detection only on the best N windows (it's O(n·m))
const MIN_RUN = 3

// ─── Corpus statistics (computed once per process; the index is static) ────────────────

interface Stats { totalVerses: number; verseFreq: Map<string, number> }
let _stats: Stats | null = null

function verseRange(book: BookIndex, vi: number): [number, number] {
  return [book.v[vi][2], vi + 1 < book.v.length ? book.v[vi + 1][2] : book.w.length]
}

function getStats(): Stats {
  if (_stats) return _stats
  const index = getCorpusIndex(CORPUS)
  const verseFreq = new Map<string, number>()
  let totalVerses = 0
  for (const book of Object.values(index)) {
    totalVerses += book.v.length
    for (let vi = 0; vi < book.v.length; vi++) {
      const [a, b] = verseRange(book, vi)
      const seen = new Set<string>()
      for (let t = a; t < b; t++) {
        const s = book.w[t][0]
        if (s && !seen.has(s)) { seen.add(s); verseFreq.set(s, (verseFreq.get(s) ?? 0) + 1) }
      }
    }
  }
  _stats = { totalVerses, verseFreq }
  return _stats
}

/** Rarity badges for the UI: LXX verse-frequency of each Strong's. */
export function strongsFrequencies(strongs: string[]): { totalVerses: number; counts: Record<string, number> } {
  const { totalVerses, verseFreq } = getStats()
  const counts: Record<string, number> = {}
  for (const s of strongs) counts[s] = verseFreq.get(s) ?? 0
  return { totalVerses, counts }
}

// ─── Search ─────────────────────────────────────────────────────────────────────────────

export function searchAllusions(input: {
  selected: string[]                       // Strong's numbers the student picked
  selectedForms?: Record<string, string[]> // strongs → NT inflected forms (for the exact-form bonus)
  sourceTokens?: SourceToken[]             // the whole NT passage, in order (for run detection)
}): AllusionResult {
  const index = getCorpusIndex(CORPUS)
  const { totalVerses, verseFreq } = getStats()

  const selectedSet = new Set(input.selected.filter(Boolean))
  const freqOut: Record<string, number> = {}
  selectedSet.forEach(s => { freqOut[s] = verseFreq.get(s) ?? 0 })
  if (selectedSet.size === 0) return { totalVerses, hits: [], frequencies: freqOut }

  const idf = (s: string) => Math.log((totalVerses + 1) / ((verseFreq.get(s) ?? 0) + 1))

  // Folded NT forms per selected Strong's, for the exact-form bonus.
  const formsOf = new Map<string, Set<string>>()
  for (const [s, forms] of Object.entries(input.selectedForms ?? {})) {
    formsOf.set(s, new Set(forms.map(normalizeGreek)))
  }

  // Source token stream for run detection (only tokens with a Strong's).
  const source: SourceToken[] = (input.sourceTokens ?? [])
    .filter(t => t.s)
    .map(t => ({ s: t.s, f: normalizeGreek(t.f) }))

  // At least two distinct shared words unless only one was selected — a lone common word
  // would otherwise return half the Septuagint.
  const minDistinct = Math.min(2, selectedSet.size)

  interface Window {
    osis: string; viStart: number; viEnd: number
    hits: { s: string; f: string; ti: number }[]   // ti = token index within the book
    score: number
  }
  const windows: Window[] = []

  for (const [osis, book] of Object.entries(index)) {
    if (!book.v?.length) continue
    // verse index → matched tokens in that verse
    const byVerse = new Map<number, { s: string; f: string; ti: number }[]>()
    let vi = 0
    for (let t = 0; t < book.w.length; t++) {
      while (vi + 1 < book.v.length && book.v[vi + 1][2] <= t) vi++
      const s = book.w[t][0]
      if (selectedSet.has(s)) {
        const arr = byVerse.get(vi) ?? []
        arr.push({ s, f: book.w[t][1], ti: t })
        byVerse.set(vi, arr)
      }
    }
    if (byVerse.size === 0) continue

    for (const center of Array.from(byVerse.keys())) {
      const viStart = Math.max(0, center - WINDOW)
      const viEnd = Math.min(book.v.length - 1, center + WINDOW)
      const hits: { s: string; f: string; ti: number }[] = []
      for (let v = viStart; v <= viEnd; v++) hits.push(...(byVerse.get(v) ?? []))

      const distinct = new Map<string, { count: number; exact: boolean; form: string }>()
      for (const h of hits) {
        const d = distinct.get(h.s) ?? { count: 0, exact: false, form: h.f }
        d.count++
        if (formsOf.get(h.s)?.has(h.f)) d.exact = true
        distinct.set(h.s, d)
      }
      if (distinct.size < minDistinct) continue

      let score = 0
      for (const [s, d] of Array.from(distinct.entries())) {
        const w = idf(s)
        score += w * (d.exact ? 1.25 : 1)
        score += Math.min(d.count - 1, 3) * 0.1 * w   // repeats help a little, capped
      }
      windows.push({ osis, viStart, viEnd, hits, score })
    }
  }

  // Best-first; suppress windows overlapping a better one in the same book.
  windows.sort((a, b) => b.score - a.score)
  const kept: Window[] = []
  for (const w of windows) {
    if (kept.length >= RUN_CANDIDATES) break
    if (kept.some(k => k.osis === w.osis && w.viStart <= k.viEnd && w.viEnd >= k.viStart)) continue
    kept.push(w)
  }

  // Run detection on the survivors: longest common CONTIGUOUS Strong's subsequence between
  // the window's token stream and the NT source stream.
  const results: AllusionHit[] = kept.map(w => {
    const book = index[w.osis]
    const [t0] = verseRange(book, w.viStart)
    const [, t1] = verseRange(book, w.viEnd)

    let run: AllusionRun | undefined
    if (source.length >= MIN_RUN) {
      const win = book.w.slice(t0, t1)
      // DP over (window × source); O(n·m) but both are small and only RUN_CANDIDATES deep.
      let best = 0, bestEnd = -1, bestSrcEnd = -1
      let prev = new Int32Array(source.length + 1)
      let cur = new Int32Array(source.length + 1)
      for (let i = 1; i <= win.length; i++) {
        for (let j = 1; j <= source.length; j++) {
          if (win[i - 1][0] && win[i - 1][0] === source[j - 1].s) {
            cur[j] = prev[j - 1] + 1
            if (cur[j] > best) { best = cur[j]; bestEnd = i - 1; bestSrcEnd = j - 1 }
          } else cur[j] = 0
        }
        ;[prev, cur] = [cur, prev]
        cur.fill(0)
      }
      if (best >= MIN_RUN) {
        const winRun = win.slice(bestEnd - best + 1, bestEnd + 1)
        const srcRun = source.slice(bestSrcEnd - best + 1, bestSrcEnd + 1)
        const exactForms = winRun.filter((t, k) => normalizeGreek(t[1]) === srcRun[k].f).length
        run = {
          length: best,
          exactForms,
          text: winRun.map(t => t[1]).join(' '),
          strongs: winRun.map(t => t[0]),
        }
        // A run is categorically stronger evidence than co-occurrence (Allison's device 2
        // beats device 4): weight by the run's own information content.
        const runIdf = winRun.reduce((a, t) => a + idf(t[0]), 0)
        w.score += runIdf * 1.5
        if (exactForms / best >= 0.7) w.score += runIdf * 0.75   // near-verbatim
      }
    }

    const distinct = new Map<string, AllusionMatch>()
    for (const h of w.hits) {
      const d = distinct.get(h.s)
      if (d) { d.count++; d.exactForm ||= formsOf.get(h.s)?.has(h.f) ?? false }
      else distinct.set(h.s, {
        strongs: h.s, form: h.f, count: 1,
        exactForm: formsOf.get(h.s)?.has(h.f) ?? false,
        verses: verseFreq.get(h.s) ?? 0,
      })
    }

    const hit: AllusionHit = {
      osis: w.osis,
      chapter: book.v[w.viStart][0],
      vStart: book.v[w.viStart][1],
      vEnd: book.v[w.viEnd][1],
      score: w.score,
      matches: Array.from(distinct.values()).sort((a, b) => a.verses - b.verses),
      run,
    }
    // The window may cross a chapter boundary; carry it so the UI can label
    // "Gen 49:33–50:1" honestly.
    if (book.v[w.viEnd][0] !== book.v[w.viStart][0]) hit.endChapter = book.v[w.viEnd][0]
    return hit
  })

  results.sort((a, b) => b.score - a.score)
  return { totalVerses, hits: results.slice(0, MAX_HITS), frequencies: freqOut }
}
