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
import { matchesStrongs, isSynonymMatch, synonymsOf } from './greek-synonyms'

// A word of the NT source passage, in reading order: Strong's + folded surface form.
export interface SourceToken { s: string; f: string }

// What the student picked: a single word, or a PHRASE of consecutive words treated as a unit.
// A phrase is scored on its own corpus rarity, not its members': "ἐν ἀρχῇ" is two ordinary
// words but an uncommon pairing, which is exactly the signal an allusion hunt wants.
export interface AllusionTerm {
  kind: 'word' | 'phrase'
  strongs: string[]     // 1 entry for a word, 2+ in reading order for a phrase
  forms?: string[]      // the NT inflected form(s), for the exact-form bonus
}

export interface AllusionMatch {
  strongs: string       // for a phrase, its members joined with '+'
  kind: 'word' | 'phrase'
  form: string          // the folded form(s) as they appear in the LXX hit
  count: number         // occurrences inside the window
  exactForm: boolean    // some occurrence matches the selected NT word's inflected form
  viaSynonym?: boolean  // matched through a near-synonym, not the identical lemma
  verses: number        // LXX frequency (verses for a word, occurrences for a phrase)
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

// Which corpus a search scans. NT anchors echo the LXX (Greek Strong's numbers); OT anchors
// search the MT itself — inner-biblical allusion, the same Allison machinery pointed at the
// Hebrew Bible's own reuse of itself (Exod 34:6 across the Prophets, Gen 1 in Ps 8…). The
// two cannot mix: LXX tokens carry Greek Strong's, MT tokens Hebrew ones.
export type AllusionCorpus = 'LXX' | 'MT'
const DEFAULT_CORPUS: AllusionCorpus = 'LXX'
const WINDOW = 1          // verses of context either side: a 3-verse sliding window
const MAX_HITS = 40
const RUN_CANDIDATES = 200 // run detection only on the best N windows (it's O(n·m))
const MIN_RUN = 3
// Intervening tokens tolerated inside a phrase, so "ἐν ἀρχῇ" still matches "ἐν τῇ ἀρχῇ".
const PHRASE_GAP = 1
// A matched phrase is Allison's device 2/6 territory — categorically better evidence than the
// same words happening to co-occur, so its (already rarity-based) weight is scaled up again.
const PHRASE_WEIGHT = 1.6
// A match reached through a synonym counts, but below an identical lemma: the author having
// used the very same word is the stronger claim.
const SYNONYM_WEIGHT = 0.7

// ─── Corpus statistics (computed once per process; the index is static) ────────────────

interface Stats { totalVerses: number; verseFreq: Map<string, number> }
const _stats = new Map<AllusionCorpus, Stats>()

function verseRange(book: BookIndex, vi: number): [number, number] {
  return [book.v[vi][2], vi + 1 < book.v.length ? book.v[vi + 1][2] : book.w.length]
}

function getStats(corpus: AllusionCorpus): Stats {
  const hit = _stats.get(corpus)
  if (hit) return hit
  const index = getCorpusIndex(corpus)
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
  const stats = { totalVerses, verseFreq }
  _stats.set(corpus, stats)
  return stats
}

/** Rarity badges for the UI: LXX verse-frequency of each Strong's. */
export function strongsFrequencies(strongs: string[], corpus: AllusionCorpus = DEFAULT_CORPUS): { totalVerses: number; counts: Record<string, number> } {
  const { totalVerses, verseFreq } = getStats(corpus)
  const counts: Record<string, number> = {}
  for (const s of strongs) counts[s] = verseFreq.get(s) ?? 0
  return { totalVerses, counts }
}

// How often a phrase's Strong's occur in order (gap ≤ PHRASE_GAP) anywhere in the LXX. This is
// the number that makes phrase search worth having: ἐν (G1722) and ἀρχή (G746) are common on
// their own, but the SEQUENCE is not, and only the sequence count says so.
const _phraseCounts = new Map<string, number>()
export function phraseOccurrences(strongs: string[], corpus: AllusionCorpus = DEFAULT_CORPUS): number {
  if (strongs.length < 2) return 0
  const key = `${corpus}:${strongs.join('+')}`
  const cached = _phraseCounts.get(key)
  if (cached != null) return cached
  const index = getCorpusIndex(corpus)
  let total = 0
  for (const book of Object.values(index)) {
    for (let t = 0; t < book.w.length; t++) {
      if (book.w[t][0] !== strongs[0]) continue
      let at = t, ok = true
      for (let k = 1; k < strongs.length; k++) {
        let found = -1
        for (let j = at + 1; j <= at + 1 + PHRASE_GAP && j < book.w.length; j++) {
          if (book.w[j][0] === strongs[k]) { found = j; break }
        }
        if (found < 0) { ok = false; break }
        at = found
      }
      if (ok) total++
    }
  }
  _phraseCounts.set(key, total)
  return total
}

/** Frequencies for a mixed set of terms, keyed by strongs.join('+') — the UI's rarity badges. */
export function termFrequencies(terms: AllusionTerm[], corpus: AllusionCorpus = DEFAULT_CORPUS): { totalVerses: number; counts: Record<string, number> } {
  const { totalVerses, verseFreq } = getStats(corpus)
  const counts: Record<string, number> = {}
  for (const t of terms) {
    counts[t.strongs.join('+')] = t.kind === 'phrase' && t.strongs.length > 1
      ? phraseOccurrences(t.strongs, corpus)
      : verseFreq.get(t.strongs[0]) ?? 0
  }
  return { totalVerses, counts }
}

// ─── Search ─────────────────────────────────────────────────────────────────────────────

export function searchAllusions(input: {
  terms: AllusionTerm[]
  sourceTokens?: SourceToken[]             // the whole NT passage, in order (for run detection)
  useSynonyms?: boolean                    // let a near-synonym stand in for the exact lemma
  corpus?: AllusionCorpus
}): AllusionResult {
  const corpus = input.corpus ?? DEFAULT_CORPUS
  const index = getCorpusIndex(corpus)
  const { totalVerses, verseFreq } = getStats(corpus)
  const syn = !!input.useSynonyms
  const hits = (wanted: string, candidate: string) => matchesStrongs(wanted, candidate, syn)

  const terms = input.terms.filter(t => t.strongs.length > 0)
  const freqOut = termFrequencies(terms, corpus).counts
  if (terms.length === 0) return { totalVerses, hits: [], frequencies: freqOut }

  // With synonyms on, a term is as common as its whole set — otherwise a rare word paired
  // with a frequent synonym would keep a rarity weight it no longer earns.
  const dfOf = (s: string) => syn
    ? Array.from(synonymsOf(s)).reduce((n, x) => n + (verseFreq.get(x) ?? 0), 0)
    : (verseFreq.get(s) ?? 0)
  const idf = (s: string) => Math.log((totalVerses + 1) / (dfOf(s) + 1))
  // A phrase's weight comes from how rare the SEQUENCE is, not its member words.
  const termWeight = (t: AllusionTerm) => t.kind === 'phrase' && t.strongs.length > 1
    ? Math.log((totalVerses + 1) / (phraseOccurrences(t.strongs, corpus) + 1)) * PHRASE_WEIGHT
    : idf(t.strongs[0])

  const termKey = (t: AllusionTerm) => t.strongs.join('+')
  const formsOf = new Map<string, Set<string>>(
    terms.map(t => [termKey(t), new Set((t.forms ?? []).map(normalizeGreek))]))

  // Every Strong's mentioned by any term - the trigger set for locating candidate verses.
  // With synonyms on this widens to the whole set, or a verse holding only the synonym would
  // never be seeded and so never scored.
  const anyStrongs = new Set<string>()
  for (const t of terms) for (const s of t.strongs) {
    if (syn) synonymsOf(s).forEach(x => anyStrongs.add(x))
    else anyStrongs.add(s)
  }

  // Source token stream for run detection (only tokens with a Strong's).
  const source: SourceToken[] = (input.sourceTokens ?? [])
    .filter(t => t.s)
    .map(t => ({ s: t.s, f: normalizeGreek(t.f) }))

  interface Window {
    osis: string; viStart: number; viEnd: number
    matches: AllusionMatch[]
    score: number
  }
  const windows: Window[] = []

  for (const [osis, book] of Object.entries(index)) {
    if (!book.v?.length) continue
    // Which verses contain any trigger word at all.
    const seeded = new Set<number>()
    let vi = 0
    for (let t = 0; t < book.w.length; t++) {
      while (vi + 1 < book.v.length && book.v[vi + 1][2] <= t) vi++
      if (anyStrongs.has(book.w[t][0])) seeded.add(vi)
    }
    if (seeded.size === 0) continue

    // Centre a window on every verse WITHIN REACH of a seeded verse, not only on the seeded
    // verses themselves. Centring only on seeds silently loses any pair of matches exactly
    // 2*WINDOW apart - John 1:1's arche/phos against Gen 1:1 and Gen 1:3, whose shared
    // window is centred on the unmatched Gen 1:2.
    const centers = new Set<number>()
    seeded.forEach(v => {
      for (let c = Math.max(0, v - WINDOW); c <= Math.min(book.v.length - 1, v + WINDOW); c++) centers.add(c)
    })

    for (const center of Array.from(centers)) {
      const viStart = Math.max(0, center - WINDOW)
      const viEnd = Math.min(book.v.length - 1, center + WINDOW)
      const [t0] = verseRange(book, viStart)
      const [, t1] = verseRange(book, viEnd)

      const matches: AllusionMatch[] = []
      let sawPhrase = false
      for (const term of terms) {
        const key = termKey(term)
        const wanted = formsOf.get(key) ?? new Set<string>()
        let count = 0, exactForm = false, form = '', viaSynonym = false
        if (term.kind === 'phrase' && term.strongs.length > 1) {
          for (let t = t0; t < t1; t++) {
            if (!hits(term.strongs[0], book.w[t][0])) continue
            const path = [t]
            let inexact = isSynonymMatch(term.strongs[0], book.w[t][0])
            let at = t, ok = true
            for (let k = 1; k < term.strongs.length; k++) {
              let found = -1
              for (let j = at + 1; j <= at + 1 + PHRASE_GAP && j < t1; j++) {
                if (hits(term.strongs[k], book.w[j][0])) { found = j; break }
              }
              if (found < 0) { ok = false; break }
              if (isSynonymMatch(term.strongs[k], book.w[found][0])) inexact = true
              path.push(found); at = found
            }
            if (!ok) continue
            count++
            if (inexact) viaSynonym = true
            const words = path.map(p => book.w[p][1])
            if (!form) form = words.join(' ')
            if (wanted.size > 0 && words.every(w => wanted.has(normalizeGreek(w)))) exactForm = true
          }
          if (count > 0) sawPhrase = true
        } else {
          for (let t = t0; t < t1; t++) {
            if (!hits(term.strongs[0], book.w[t][0])) continue
            count++
            if (isSynonymMatch(term.strongs[0], book.w[t][0])) viaSynonym = true
            if (!form) form = book.w[t][1]
            if (wanted.has(normalizeGreek(book.w[t][1]))) exactForm = true
          }
        }
        if (count > 0) {
          matches.push({ strongs: key, kind: term.kind, form, count, exactForm, viaSynonym,
            verses: freqOut[key] ?? 0 })
        }
      }

      // Two independent signals, or one matched phrase (a rare sequence stands on its own),
      // or the student only gave us one term to work with.
      if (matches.length === 0) continue
      if (!(matches.length >= 2 || sawPhrase || terms.length === 1)) continue

      let score = 0
      for (const m of matches) {
        const term = terms.find(t => termKey(t) === m.strongs)!
        // A synonym is real evidence but weaker than the author reaching for the same word.
        const w = termWeight(term) * (m.viaSynonym ? SYNONYM_WEIGHT : 1)
        score += w * (m.exactForm ? 1.25 : 1)
        score += Math.min(m.count - 1, 3) * 0.1 * w   // repeats help a little, capped
      }
      windows.push({ osis, viStart, viEnd, matches, score })
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
        // beats device 4): weight by the run's own information content. But only from FOUR
        // words up — three common words in a row ("ὁ λόγος οὗτος", "τὸ φῶς τοῦ") recur all
        // over the LXX by chance, and were out-scoring genuine candidates. A three-word run
        // is still reported as a badge; if the student thinks it deliberate, selecting it as
        // a PHRASE scores it on the sequence's own measured rarity.
        if (best >= 4) {
          const runIdf = winRun.reduce((a, t) => a + idf(t[0]), 0)
          w.score += runIdf * 1.5
          if (exactForms / best >= 0.7) w.score += runIdf * 0.75   // near-verbatim
        }
      }
    }

    const hit: AllusionHit = {
      osis: w.osis,
      chapter: book.v[w.viStart][0],
      vStart: book.v[w.viStart][1],
      vEnd: book.v[w.viEnd][1],
      score: w.score,
      // Phrases first, then rarest word: the order the evidence should be read in.
      matches: w.matches.slice().sort((a, b) =>
        (a.kind === b.kind ? 0 : a.kind === 'phrase' ? -1 : 1) || a.verses - b.verses),
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
