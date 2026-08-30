/**
 * The feature set the Register tool measures, and the arithmetic that turns a stretch of
 * tagged words into a profile.
 *
 * SHARED ON PURPOSE. The prebuilt index (scripts/build-style-index.ts) and the passage
 * profiler (src/lib/style-passage.ts) must count the same things the same way, or a passage's
 * distances would not be comparable with the works it is ranked against — and the drift would
 * be silent, because both sides would still produce plausible numbers. One definition, two
 * callers.
 *
 * ── Why features are lemma-anchored wherever possible ──────────────────────────────────────
 *
 * The GNT is hand-tagged; everything else is Stanza-tagged; and the LXX index omits the POS
 * field for pronouns entirely (αὐτός is there 27,006 times, parsed "singular, …" with no
 * "pronoun"). Counting POS tags therefore measures the TAGGER as much as the text — Josephus
 * shows 106/1k adverbs against the GNT's 45, which is mostly Stanza filing particles as adverbs
 * where the hand tagging calls them conjunctions.
 *
 * So: the function-word lens (Burrows's Delta, the primary signal) keys on LEMMA, which is
 * consistent everywhere. Morphology-derived features are kept, because they are what an
 * exegete actually wants to see, but each carries a `taggerSensitive` flag and the UI shows it.
 * Features are read by SCANNING the whole parsing string for a token rather than by position,
 * so the LXX's missing POS field cannot silently shift every field left.
 */

/** [strongs, normalized lemma, parsing string, wordIndex?] — the construct index's token row. */
export type Word = [string, string, string, (number | undefined)?]

export interface FeatureDef {
  key: string
  label: string
  /** Grammar chapter that teaches it; the UI links each row there. */
  chapter: string
  /** Derived from tagger categories, so comparable across works but not exact. */
  taggerSensitive: boolean
  /** A heuristic approximation of a multi-word construction. */
  approx?: boolean
}

// Scan the whole parsing string: the LXX drops the POS field, so position is unreliable.
const hasTok = (parsing: string, tok: string) => parsing.includes(tok)

/* ── lemma canonicalization ──────────────────────────────────────────────────
 * Lemma-anchored features are only safe if the corpora agree on what the lemma IS, and in
 * three places they do not. Each of these was measured across all nine corpora, and each shows
 * a COMPLEMENTARY distribution — where one form appears the other is absent — which is the
 * signature of a tagging convention rather than of an author's usage:
 *
 *   γίνομαι   GNT 4.85/1k, every other corpus 0.00
 *   γίγνομαι  GNT 0.00,    every other corpus 3.03-6.31
 *     The hand-tagged New Testament lemmatizes to the Koine spelling; Stanza, trained on
 *     Attic, gives the Attic one. Both are Strong's G1096. Left unfolded this was the single
 *     largest "difference" the tool reported between Tobit and Mark — an entirely spurious
 *     one, and on the flagship Septuagintal feature.
 *
 *   οὕτω      GNT 1.52, LXX 1.34, every other corpus 0.00-0.01
 *   οὕτως     GNT 0.00, LXX 0.05, every other corpus 1.27-2.95
 *     Same word (G3779), same split.
 *
 *   ἀλλ' δι' οὐδ' μηδ' ἐφ' ὑφ' κατ' καθ' μετ' μεθ' ἐπ' ὑπ'
 *     Elided and aspirated forms that Stanza leaves unresolved and the hand tagging resolves.
 *     Josephus's ἀλλά looked 2.4x rarer than the New Testament's until ἀλλ' was counted with
 *     it; half of that gap was the apostrophe.
 *
 * Folding is one-directional and total: the canonical form is what every corpus is counted as
 * using, so a rate is comparable wherever it is read.
 */
export const LEMMA_CANON: Record<string, string> = {
  γιγνομαι: 'γινομαι',
  ουτω: 'ουτως',
  αλλ: 'αλλα',
  δι: 'δια',
  ουδ: 'ουδε',
  μηδ: 'μηδε',
  επ: 'επι', εφ: 'επι',
  υπ: 'υπο', υφ: 'υπο',
  κατ: 'κατα', καθ: 'κατα',
  μετ: 'μετα', μεθ: 'μετα',
  απ: 'απο', αφ: 'απο',
  υπερ: 'υπερ',
}

/**
 * Lemmas that must never become a Delta dimension, because they measure the tagger rather than
 * the text. Delta compares the 150 commonest lemmas, and both of these are frequent enough to
 * make that list.
 *
 *   ''      A word the tagger failed on. Concentrated where tagging was hardest — Eusebius
 *           0.44% of all words, Philo 0.23%, the hand-tagged New Testament exactly 0 — so the
 *           dimension ranks works by how well they were tagged.
 *   ἵημι    Stanza's garbage bin for anything it cannot place: 563 "present active imperatives
 *           of ἵημι" in Justin alone, who shows 28/1k against the Greco-Roman corpus's 0.64
 *           though both were tagged by the same tool.
 */
export const DELTA_EXCLUDE = new Set(['', 'ιημι'])

/** The lemma every corpus is counted as using. */
export const canonLemma = (l: string): string => LEMMA_CANON[l] ?? l


interface RateFeature extends FeatureDef {
  test: (w: Word) => boolean
}

export const RATE_FEATURES: RateFeature[] = [
  // — the ones the instructor named —
  { key: 'participle',    label: 'Participles',            chapter: 'participles',  taggerSensitive: true,
    test: w => hasTok(w[2], 'participle') },
  { key: 'infinitive',    label: 'Infinitives',            chapter: 'infinitives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'infinitive') },
  // — mood —
  { key: 'optative',      label: 'Optatives',              chapter: 'subjunctives', taggerSensitive: true,
    test: w => hasTok(w[2], 'optative') },
  { key: 'subjunctive',   label: 'Subjunctives',           chapter: 'subjunctives', taggerSensitive: true,
    test: w => hasTok(w[2], 'subjunctive') },
  { key: 'imperative',    label: 'Imperatives',            chapter: 'imperatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'imperative') },
  // — tense —
  { key: 'aorist',        label: 'Aorists',                chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'aorist') },
  { key: 'imperfect',     label: 'Imperfects',             chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'imperfect') },
  { key: 'perfect',       label: 'Perfects',               chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'perfect') },
  { key: 'future',        label: 'Futures',                chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'future') },
  // — case —
  { key: 'genitive',      label: 'Genitives',              chapter: 'nouns',        taggerSensitive: true,
    test: w => hasTok(w[2], 'genitive') },
  { key: 'dative',        label: 'Datives',                chapter: 'nouns',        taggerSensitive: true,
    test: w => hasTok(w[2], 'dative') },
  { key: 'accusative',    label: 'Accusatives',            chapter: 'nouns',        taggerSensitive: true,
    test: w => hasTok(w[2], 'accusative') },
  // — lemma-anchored: these are SAFE across corpora —
  { key: 'kai',           label: 'καί',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'και' },
  { key: 'de',            label: 'δέ',                     chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'δε' },
  { key: 'gar',           label: 'γάρ',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'γαρ' },
  { key: 'oun',           label: 'οὖν',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'ουν' },
  { key: 'literaryParticles', label: 'Literary particles (τε, μέν, δή, γε)', chapter: 'conj-adv',
    taggerSensitive: false,
    test: w => w[1] === 'τε' || w[1] === 'μεν' || w[1] === 'δη' || w[1] === 'γε' },
  { key: 'article',       label: 'Article',                chapter: 'nouns',        taggerSensitive: false,
    test: w => w[1] === 'ο' },
  { key: 'hoti',          label: 'ὅτι',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'οτι' },
  { key: 'hina',          label: 'ἵνα',                    chapter: 'subjunctives', taggerSensitive: false,
    test: w => w[1] === 'ινα' },
  { key: 'egeneto',       label: 'γίνομαι (καὶ ἐγένετο …)', chapter: 'indicatives', taggerSensitive: false,
    test: w => w[1] === 'γινομαι' },
]

/**
 * Multi-word constructions. Approximations, and labelled as such in the UI. A genitive
 * absolute is a genitive participle with a genitive substantive beside it and no article
 * binding them; without a dependency parse that is the honest best, and it is stable enough to
 * compare LIKE WITH LIKE across corpora even where the absolute count is off.
 */
export function constructionIndices(words: Word[]): Record<string, number[]> {
  const genAbs: number[] = [], artInf: number[] = [], periphrastic: number[] = []
  for (let i = 0; i < words.length; i++) {
    const p = words[i][2]
    // genitive absolute: genitive participle with a genitive neighbour within two words
    if (hasTok(p, 'participle') && hasTok(p, 'genitive')) {
      for (let j = Math.max(0, i - 2); j <= Math.min(words.length - 1, i + 2); j++) {
        if (j === i) continue
        if (hasTok(words[j][2], 'genitive') && words[j][1] !== 'ο') { genAbs.push(i); break }
      }
    }
    // articular infinitive: the article (any case) immediately before an infinitive,
    // optionally with a preposition in front (διὰ τὸ εἶναι)
    if (hasTok(p, 'infinitive') && i > 0 && words[i - 1][1] === 'ο') artInf.push(i)
    // periphrastic: εἰμί within three words of a participle
    if (words[i][1] === 'ειμι') {
      for (let j = i + 1; j <= Math.min(words.length - 1, i + 3); j++) {
        if (hasTok(words[j][2], 'participle')) { periphrastic.push(i); break }
      }
    }
  }
  return { genAbs, artInf, periphrastic }
}

/**
 * Counts, from the same walk that records WHERE each construction stands. The report cites
 * references for the traits it claims two texts share, and a second implementation of "is this
 * a genitive absolute" would eventually cite one thing while counting another.
 */
export function countConstructions(words: Word[]): Record<string, number> {
  const at = constructionIndices(words)
  return { genAbs: at.genAbs.length, artInf: at.artInf.length, periphrastic: at.periphrastic.length }
}

export const CONSTRUCTIONS: FeatureDef[] = [
  { key: 'genAbs',       label: 'Genitive absolute',   chapter: 'participles',  taggerSensitive: true, approx: true },
  { key: 'artInf',       label: 'Articular infinitive', chapter: 'infinitives', taggerSensitive: true, approx: true },
  { key: 'periphrastic', label: 'Periphrastic (εἰμί + participle)', chapter: 'indicatives', taggerSensitive: true, approx: true },
]

/** Every feature, in the order the index writes them. */
export const FEATURES: FeatureDef[] = [
  ...RATE_FEATURES.map(({ test: _test, ...f }) => f),
  ...CONSTRUCTIONS,
]

export interface Profile {
  n: number
  /** Occurrences per 1,000 words, keyed by feature. */
  rates: Record<string, number>
  /** Raw lemma counts, for Delta and for vocabulary overlap. */
  lem: Map<string, number>
}

/** Profile one stretch of words. The single definition both the builder and the API use. */
export function profileWords(input: Word[]): Profile {
  // Canonicalize ONCE, here, so every feature test and the Delta vector alike see the same
  // lemma. Doing it at the call sites instead would mean the builder and the passage profiler
  // could disagree, which is exactly the drift this module exists to prevent.
  const words: Word[] = input.map(w => {
    const c = LEMMA_CANON[w[1]]
    return c === undefined ? w : [w[0], c, w[2], w[3]]
  })

  const n = words.length
  const rates: Record<string, number> = {}
  for (const f of RATE_FEATURES) {
    let c = 0
    for (const w of words) if (f.test(w)) c++
    rates[f.key] = n ? (1000 * c) / n : 0
  }
  const cons = countConstructions(words)
  for (const c of CONSTRUCTIONS) rates[c.key] = n ? (1000 * cons[c.key]) / n : 0

  const lem = new Map<string, number>()
  for (const w of words) lem.set(w[1], (lem.get(w[1]) ?? 0) + 1)
  return { n, rates, lem }
}

/**
 * z-score a profile's function-word frequencies against the corpus-wide mean and spread that
 * the index was built with. Burrows's Delta compares these vectors; computing them from the
 * SAME mu/sd is what lets an ad-hoc passage be ranked against the prebuilt works at all.
 */
export function deltaVector(
  p: Profile, deltaWords: string[], mu: Record<string, number>, sd: Record<string, number>,
): number[] {
  return deltaWords.map(l => {
    const freq = p.n ? 1000 * ((p.lem.get(l) ?? 0) / p.n) : 0
    return (freq - (mu[l] ?? 0)) / (sd[l] || 1e-9)
  })
}

/**
 * The content vocabulary of a profile: the commonest lemmas that are NOT Delta dimensions,
 * as rates per 1,000 words.
 *
 * Shared by the builder and the passage API for the same reason profileWords is — the
 * vocabulary lens compares a passage's list against the prebuilt ones, and a list cut a
 * different way would not be comparable.
 */
export function contentVocab(
  p: Profile, deltaWords: Iterable<string>, limit = 200,
): [string, number][] {
  const skip = new Set(deltaWords)
  const out: [string, number][] = []
  p.lem.forEach((c, l) => { if (!skip.has(l) && l) out.push([l, c]) })
  return out
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([l, c]) => [l, +(1000 * c / p.n).toFixed(2)] as [string, number])
}

/**
 * Aristotle’s axis (Rhet. 3.9): the share of clause-linking done by subordination rather than
 * coordination. Shared for the same reason profileWords is — a passage scored by one formula
 * and ranked against works scored by another would be silently wrong.
 */
export function periodicityOf(rates: Record<string, number>): number {
  const sub = (rates.participle ?? 0) + (rates.infinitive ?? 0) + (rates.hoti ?? 0) + (rates.hina ?? 0)
  const co = (rates.kai ?? 0) + (rates.de ?? 0)
  return sub + co > 0 ? +(sub / (sub + co)).toFixed(4) : 0
}
