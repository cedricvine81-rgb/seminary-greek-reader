// Redaction comparison for the Synopsis tab's "Compare" mode: aligns two parallel Greek
// passages token-by-token (lemma-level LCS) and classifies every word of the target
// against the source using the ancient paraphrase categories (Theon, Progymnasmata
// 101.7-9: variation in syntax, addition, subtraction, substitution, and combinations;
// cf. Quintilian, Inst. 1.9.2; 10.5.4-11). The classification is deliberately directional
// — "what did the target's author do to the source?" — so the caller chooses which
// column is the source and we stay neutral on Synoptic source theories.

/** How a target-column token relates to the source passage. */
export type RedactionTag =
  | 'same'    // verbatim: same lemma, same inflected form
  | 'form'    // same lemma, different form (Theon's "variation in syntax": tense/case/etc.)
  | 'moved'   // same lemma, out of shared order (word-order / construction change)
  | 'subst'   // different lemma filling the same slot (substitution)
  | 'added'   // no counterpart in the source (addition / elaboration)

export type CompareToken = { lemma: string; surface: string; parsing?: string }

export type CompareResult = {
  /** One tag per target token. */
  tags: RedactionTag[]
  /** Per source token: was it taken up by the target in any way (same/form/moved/subst)? */
  sourceUsed: boolean[]
  /** Per target token: the index of the source token it was matched to, or null for an
   *  addition. Every matching pass knows this pairing; keeping it lets the Synopsis tab
   *  light up a word's counterpart across columns and aggregate the pairs into
   *  verse-to-verse correspondences. */
  links: (number | null)[]
  stats: {
    sourceTotal: number
    targetTotal: number
    same: number
    form: number
    moved: number
    subst: number
    added: number
    omitted: number
    /** same+form+moved as a share of the source's words. */
    retentionPct: number
    /** Same, but over content words only (articles, conjunctions, prepositions,
     *  particles, and pronouns excluded) — the honest agreement figure, since shared
     *  καί's and ὁ's otherwise inflate the score between unrelated accounts. */
    contentRetentionPct: number
    /** Among 'form' pairs, how many changed tense (e.g. historical present → aorist). */
    tenseChanges: number
  }
}

// Fold case + strip diacritics/punctuation so "Σὺ" ≡ "σù" but inflection differences
// still register (we compare full normalized surfaces, not stems). NFD splits accents
// into combining marks (U+0300–U+036F), which the first class removes; the second drops
// the punctuation that rides along on token surfaces.
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,·;:!?'"()‘’«»—–…\-;·]/g, '').toLowerCase()

const TENSE_RE = /(pluperfect|imperfect|present|future|aorist|perfect)/i
const tenseOf = (parsing?: string): string | null => parsing?.match(TENSE_RE)?.[1].toLowerCase() ?? null

// Function words, detected from the parsing string both Greek editions supply
// ("Article, …", "Conjunction", "Personal Pronoun, …"). The lemma stoplist backs it up
// for tokens whose parsing is missing.
const FUNCTION_POS_RE = /article|conjunction|preposition|particle|pronoun|interjection/i
const FUNCTION_LEMMAS = new Set(['ο', 'και', 'δε', 'εν', 'εις', 'εκ', 'αυτος', 'ουτος', 'συ', 'εγω', 'ος', 'γαρ', 'τε', 'αλλα', 'μη', 'ου', 'ουκ', 'προς', 'επι', 'υπο', 'απο', 'μετα', 'περι', 'δια', 'κατα', 'παρα', 'συν', 'οτι', 'ως', 'ει', 'ινα', 'αν', 'εαν'])
export const isFunctionWord = (t: CompareToken): boolean =>
  (t.parsing ? FUNCTION_POS_RE.test(t.parsing) : false) || FUNCTION_LEMMAS.has(norm(t.lemma || t.surface))

/** Alignment key: lemma when present, else the normalized surface. */
const keyOf = (t: CompareToken) => (t.lemma ? norm(t.lemma) : norm(t.surface))

/**
 * Longest common subsequence over lemma keys. Passages are pericope-sized (rarely more
 * than a few hundred words), so the O(n·m) table is cheap; still, cap the quadratic work
 * so a pathological whole-chapter × whole-chapter compare can't lock the UI thread.
 */
function lcsPairs(a: string[], b: string[]): [number, number][] {
  if (a.length * b.length > 4_000_000) return []
  const n = a.length, m = b.length
  // dp[i][j] = LCS length of a[i..] vs b[j..], flattened.
  const w = m + 1
  const dp = new Uint16Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1])
  const pairs: [number, number][] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++ }
    else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++
    else j++
  }
  return pairs
}

export function compareRedaction(source: CompareToken[], target: CompareToken[]): CompareResult {
  const sKeys = source.map(keyOf)
  const tKeys = target.map(keyOf)
  const pairs = lcsPairs(sKeys, tKeys)

  const tags: RedactionTag[] = new Array(target.length).fill('added')
  const sourceUsed: boolean[] = new Array(source.length).fill(false)
  const links: (number | null)[] = new Array(target.length).fill(null)
  let same = 0, form = 0, tenseChanges = 0

  const classifyPair = (si: number, ti: number): void => {
    sourceUsed[si] = true
    links[ti] = si
    if (norm(source[si].surface) === norm(target[ti].surface)) { tags[ti] = 'same'; same++ }
    else {
      tags[ti] = 'form'; form++
      const st = tenseOf(source[si].parsing), tt = tenseOf(target[ti].parsing)
      if (st && tt && st !== tt) tenseChanges++
    }
  }
  for (const [si, ti] of pairs) classifyPair(si, ti)

  // Words sharing a lemma but falling outside the common order: transposed, not new.
  // (A construction recast — e.g. a participle folded into a main verb elsewhere in the
  // clause — lands here too; both are Theon's "variation in syntax".) Greedy nearest-
  // position pairing keeps a lemma that occurs twice from grabbing the wrong twin.
  const unmatchedS: number[] = source.map((_, i) => i).filter(i => !sourceUsed[i])
  const unmatchedT: number[] = target.map((_, i) => i).filter(i => tags[i] === 'added')
  let moved = 0
  for (const ti of unmatchedT) {
    let best = -1, bestDist = Infinity
    for (const si of unmatchedS) {
      if (sourceUsed[si] || sKeys[si] !== tKeys[ti]) continue
      const dist = Math.abs(si / Math.max(1, source.length) - ti / Math.max(1, target.length))
      if (dist < bestDist) { best = si; bestDist = dist }
    }
    if (best !== -1) {
      sourceUsed[best] = true
      links[ti] = best
      // Same inflected form, just relocated → still 'moved'; a changed form counts the
      // tense shift like a matched pair would.
      tags[ti] = 'moved'; moved++
      const st = tenseOf(source[best].parsing), tt = tenseOf(target[ti].parsing)
      if (st && tt && st !== tt) tenseChanges++
    }
  }

  // Substitution: leftover target words positionally paired with leftover source words
  // inside the same inter-match gap (a different lemma occupying the same slot).
  let subst = 0
  {
    // Gap boundaries come from the matched pairs (in order).
    const matchedT = pairs.map(p => p[1])
    const matchedS = pairs.map(p => p[0])
    const gapOf = (idx: number, matched: number[]): number => {
      // Number of matched positions before idx = which gap it sits in.
      let g = 0
      while (g < matched.length && matched[g] < idx) g++
      return g
    }
    const sByGap = new Map<number, number[]>()
    for (let si = 0; si < source.length; si++) {
      if (sourceUsed[si]) continue
      const g = gapOf(si, matchedS)
      ;(sByGap.get(g) ?? sByGap.set(g, []).get(g)!).push(si)
    }
    for (let ti = 0; ti < target.length; ti++) {
      if (tags[ti] !== 'added') continue
      const g = gapOf(ti, matchedT)
      const cands = sByGap.get(g)
      const si = cands?.shift()
      if (si !== undefined) { sourceUsed[si] = true; links[ti] = si; tags[ti] = 'subst'; subst++ }
    }
  }

  const added = tags.filter(t => t === 'added').length
  const omitted = sourceUsed.filter(u => !u).length
  const retained = same + form + moved
  // Content-word retention: of the source's content words, how many did the target
  // take up in any form (verbatim, re-inflected, moved, or — no — substitution is a
  // replacement, so it does not count as retained).
  let contentTotal = 0, contentRetained = 0
  const retainedTags = new Set<RedactionTag>(['same', 'form', 'moved'])
  // Recover which source tokens were retained (vs substituted-away): a source token is
  // "retained" if some target token tagged same/form/moved consumed it. We didn't store
  // per-pair links, so approximate from the target side by lemma budget.
  const retainedBudget = new Map<string, number>()
  target.forEach((t, ti) => {
    if (retainedTags.has(tags[ti])) {
      const k = keyOf(t)
      retainedBudget.set(k, (retainedBudget.get(k) ?? 0) + 1)
    }
  })
  source.forEach(t => {
    if (isFunctionWord(t)) return
    contentTotal++
    const k = keyOf(t)
    const left = retainedBudget.get(k) ?? 0
    if (left > 0) { contentRetained++; retainedBudget.set(k, left - 1) }
  })
  return {
    tags, sourceUsed, links,
    stats: {
      sourceTotal: source.length, targetTotal: target.length,
      same, form, moved, subst, added, omitted,
      retentionPct: source.length ? Math.round((retained / source.length) * 100) : 0,
      contentRetentionPct: contentTotal ? Math.round((contentRetained / contentTotal) * 100) : 0,
      tenseChanges,
    },
  }
}
