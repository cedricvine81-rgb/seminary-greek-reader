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

// ── Part-of-speech tiers ────────────────────────────────────────────────────────────
// Words carry different kinds of editorial evidence, so the alignment treats them in
// three tiers:
//   lexical (noun/verb/adjective/adverb/number/other) — full participants: they anchor
//     the alignment and can be tagged form / moved / subst.
//   pron — pronouns align and can be re-inflected or substituted (second person becoming
//     third IS the transferal signal), but are excluded from the global "moved" pass:
//     they recur far too often for an out-of-order lemma match to mean relocation.
//   glue (article/conjunction/preposition/particle/interjection) — never independent
//     editorial acts: an article's case follows its noun, a καί belongs to its clause.
//     Glue is matched only inside the local window of an already-aligned neighbour, and
//     otherwise counts with the phrase it belongs to.
type PosClass = 'noun' | 'verb' | 'adj' | 'adv' | 'num' | 'pron' | 'glue' | 'other'
const POS_RULES: [RegExp, PosClass][] = [
  [/pronoun/i, 'pron'],                                            // before noun — "Pronoun" contains it
  [/article|conjunction|preposition|particle|interjection/i, 'glue'],
  [/verb|participle|infinitive/i, 'verb'],
  [/noun/i, 'noun'],
  [/adjective/i, 'adj'],
  [/adverb/i, 'adv'],
  [/number|numeral/i, 'num'],
]
const GLUE_LEMMAS = new Set(['ο', 'και', 'δε', 'εν', 'εις', 'εκ', 'γαρ', 'τε', 'αλλα', 'μη', 'ου', 'ουκ', 'ουχ', 'ουδε', 'μηδε', 'ουτε', 'μητε', 'προς', 'επι', 'υπο', 'απο', 'μετα', 'περι', 'δια', 'κατα', 'παρα', 'συν', 'οτι', 'ως', 'ει', 'ινα', 'αν', 'εαν'])
const PRON_LEMMAS = new Set(['αυτος', 'ουτος', 'συ', 'εγω', 'ος', 'τις', 'εκεινος', 'οστις'])
function posClassOf(t: CompareToken): PosClass {
  // The glue lemma list overrides the POS string: MACULA parses the negations (οὐ, μή,
  // οὐδέ, …) as adverbs, but a negative belongs with its verb — it is no more an
  // independent editorial act than an article. (No lexical lemma collides with this
  // list: e.g. εἶ "you are" lemmatizes to εἰμί, not to the conditional εἰ.)
  const k = norm(t.lemma || t.surface)
  if (GLUE_LEMMAS.has(k)) return 'glue'
  if (t.parsing) for (const [re, c] of POS_RULES) if (re.test(t.parsing)) return c
  return PRON_LEMMAS.has(k) ? 'pron' : 'other'
}
/** Articles, conjunctions, prepositions, particles — the tier that never carries an
 *  editorial tag of its own. Exported for the source column's strike-through logic. */
export const isGlueWord = (t: CompareToken): boolean => posClassOf(t) === 'glue'

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
  const sClass = source.map(posClassOf)
  const tClass = target.map(posClassOf)

  const tags: RedactionTag[] = new Array(target.length).fill('added')
  const sourceUsed: boolean[] = new Array(source.length).fill(false)
  const links: (number | null)[] = new Array(target.length).fill(null)
  let same = 0, form = 0, tenseChanges = 0

  // The alignable tier: everything except glue. Glue words would otherwise thread
  // spurious LCS chains (every καί matches every καί) and then wear editorial colours
  // for matches that reflect no editorial act — the "from which article was ὁ changed?"
  // problem. They are handled in their own pass at the end.
  const alignS = source.map((_, i) => i).filter(i => sClass[i] !== 'glue')
  const alignT = target.map((_, i) => i).filter(i => tClass[i] !== 'glue')
  const pairs = lcsPairs(alignS.map(i => sKeys[i]), alignT.map(i => tKeys[i]))

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
  for (const [ps, pt] of pairs) classifyPair(alignS[ps], alignT[pt])

  // Words sharing a lemma but falling outside the common order: transposed, not new.
  // (A construction recast — e.g. a participle folded into a main verb elsewhere in the
  // clause — lands here too; both are Theon's "variation in syntax".) Lexical words
  // only: pronouns recur so often that an out-of-order match is coincidence, not
  // relocation — and a pronoun wrongly consumed here is one the substitution pass can
  // no longer pair (that greed used to hide Σύ → Οὗτός at the baptism).
  let moved = 0
  for (const ti of alignT) {
    if (tags[ti] !== 'added' || tClass[ti] === 'pron') continue
    let best = -1, bestDist = Infinity
    for (const si of alignS) {
      if (sourceUsed[si] || sClass[si] === 'pron' || sKeys[si] !== tKeys[ti]) continue
      const dist = Math.abs(si / Math.max(1, source.length) - ti / Math.max(1, target.length))
      if (dist < bestDist) { best = si; bestDist = dist }
    }
    if (best !== -1) {
      sourceUsed[best] = true
      links[ti] = best
      tags[ti] = 'moved'; moved++
      const st = tenseOf(source[best].parsing), tt = tenseOf(target[ti].parsing)
      if (st && tt && st !== tt) tenseChanges++
    }
  }

  // Substitution: leftover words paired inside the same inter-match gap — but only
  // between words of the same part-of-speech class ("a different word in the same slot"
  // presumes the same kind of slot), and only in small gaps: word-for-word substitution
  // is a local rewrite, and inside a wholesale addition or omission positional pairing
  // would manufacture correspondences that are not there.
  let subst = 0
  {
    const SUBST_GAP_CAP = 8
    // Gap = number of LCS matches (in align coordinates) before the position.
    const posS = new Map<number, number>(); alignS.forEach((si, p) => posS.set(si, p))
    const posT = new Map<number, number>(); alignT.forEach((ti, p) => posT.set(ti, p))
    const matchedPosS = pairs.map(p => p[0])
    const matchedPosT = pairs.map(p => p[1])
    const gapOf = (pos: number, matched: number[]): number => {
      let g = 0
      while (g < matched.length && matched[g] < pos) g++
      return g
    }
    const sByGap = new Map<number, number[]>()
    for (const si of alignS) {
      if (sourceUsed[si]) continue
      const g = gapOf(posS.get(si)!, matchedPosS)
      ;(sByGap.get(g) ?? sByGap.set(g, []).get(g)!).push(si)
    }
    const tGap = new Map<number, number>()
    const tCountByGap = new Map<number, number>()
    for (const ti of alignT) {
      if (tags[ti] !== 'added') continue
      const g = gapOf(posT.get(ti)!, matchedPosT)
      tGap.set(ti, g)
      tCountByGap.set(g, (tCountByGap.get(g) ?? 0) + 1)
    }
    const sGapLen = new Map<number, number>()
    sByGap.forEach((v, g) => sGapLen.set(g, v.length))
    for (const ti of alignT) {
      if (tags[ti] !== 'added') continue
      const g = tGap.get(ti)!
      if ((sGapLen.get(g) ?? 0) > SUBST_GAP_CAP || (tCountByGap.get(g) ?? 0) > SUBST_GAP_CAP) continue
      const cands = sByGap.get(g)
      if (!cands) continue
      const idx = cands.findIndex(si => sClass[si] === tClass[ti])
      if (idx !== -1) {
        const si = cands.splice(idx, 1)[0]
        sourceUsed[si] = true; links[ti] = si; tags[ti] = 'subst'; subst++
      }
    }
  }

  // Glue: matched only through an aligned neighbour. An article, particle, or
  // preposition takes its identity from the phrase it sits in, so it counts as carried
  // over when the neighbouring aligned word's source context contains the same lemma —
  // and otherwise simply belongs to added (or omitted) material. It never wears
  // form/moved/subst.
  {
    const GLUE_WINDOW = 3
    for (let ti = 0; ti < target.length; ti++) {
      if (tClass[ti] !== 'glue') continue
      let anchor = -1
      for (let d = 1; d <= GLUE_WINDOW && anchor === -1; d++) {
        if (ti + d < target.length && links[ti + d] !== null) anchor = ti + d      // prefer following: article → its noun
        else if (ti - d >= 0 && links[ti - d] !== null) anchor = ti - d
      }
      if (anchor === -1) continue                          // inside added material → stays 'added'
      const s0 = links[anchor]!
      for (let d = -GLUE_WINDOW; d <= GLUE_WINDOW; d++) {
        const si = s0 + d
        if (si < 0 || si >= source.length) continue
        if (sourceUsed[si] || sClass[si] !== 'glue' || sKeys[si] !== tKeys[ti]) continue
        sourceUsed[si] = true; links[ti] = si; tags[ti] = 'same'; same++
        break
      }
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
