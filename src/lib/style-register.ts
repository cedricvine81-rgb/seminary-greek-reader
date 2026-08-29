/**
 * Register — comparing how the Greek of one work behaves against the rest of the library.
 *
 * The index is built by scripts/build-style-index.mjs and served as a static asset. Everything
 * here is pure: the view fetches once and computes distances in the browser, because 433 works
 * against 150 dimensions is a few milliseconds and it keeps the tool responsive while the
 * reader changes lenses.
 *
 * ── What the numbers mean, and what they do not ────────────────────────────────────────────
 *
 * This measures REGISTER — the level and texture of the Greek — not authorship. The validation
 * run makes the boundary concrete: Ephesians→Colossians and 1→2 Timothy come first of 432, and
 * Luke→Acts third, which is the tool working. But Hebrews also ranks first to Romans, where its
 * Greek is usually held to be the least Pauline in the New Testament. Function-word profiles
 * track GENRE at least as strongly as authorship, so the UI says "similar register", never
 * "same author", and the caveat is on the page rather than buried here.
 */

export type Lens = 'register' | 'syntax' | 'vocabulary'

export interface StyleFeature {
  key: string
  label: string
  chapter: string
  /** Derived from tagger categories, so comparable across works but not exact. */
  taggerSensitive: boolean
  /** A heuristic approximation of a multi-word construction. */
  approx?: boolean
}

export interface StyleMeta {
  chunkWords: number
  minWords: number
  deltaWords: string[]
  features: StyleFeature[]
}

export interface StyleUnit {
  corpus: string
  work: string
  label: string
  kind: 'work' | 'chunk'
  idx: number
  n: number
  /** False when the unit is too short for the distance to be steady — the UI must say so. */
  reliable: boolean
  rates: Record<string, number>
  delta: number[]
}

export interface Neighbour {
  unit: StyleUnit
  distance: number
}

/** Burrows's Delta: mean absolute difference of z-scored function-word frequencies. */
export function delta(a: StyleUnit, b: StyleUnit): number {
  let sum = 0
  const n = Math.min(a.delta.length, b.delta.length)
  for (let i = 0; i < n; i++) sum += Math.abs(a.delta[i] - b.delta[i])
  return sum / n
}

/** Distance over the syntactic rates, each scaled by its spread across the corpus. */
export function syntaxDistance(a: StyleUnit, b: StyleUnit, spread: Record<string, number>): number {
  const keys = Object.keys(a.rates)
  let sum = 0
  for (const k of keys) {
    const s = spread[k] || 1
    sum += Math.abs((a.rates[k] ?? 0) - (b.rates[k] ?? 0)) / s
  }
  return sum / keys.length
}

/** Per-feature standard deviation across whole works — the scale for syntaxDistance. */
export function featureSpread(units: StyleUnit[]): Record<string, number> {
  const works = units.filter(u => u.kind === 'work')
  const out: Record<string, number> = {}
  if (!works.length) return out
  for (const k of Object.keys(works[0].rates)) {
    const xs = works.map(w => w.rates[k] ?? 0)
    const m = xs.reduce((a, b) => a + b, 0) / xs.length
    out[k] = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1
  }
  return out
}

export interface NeighbourOptions {
  /** Drop candidates from the target's own corpus — "what OUTSIDE the NT reads like this?" */
  excludeSameCorpus?: boolean
  /** Hide units too short to be steady. */
  reliableOnly?: boolean
  limit?: number
}

export function neighbours(
  target: StyleUnit,
  units: StyleUnit[],
  lens: Lens,
  spread: Record<string, number>,
  opts: NeighbourOptions = {},
): Neighbour[] {
  const { excludeSameCorpus = false, reliableOnly = true, limit = 25 } = opts
  const measure = lens === 'syntax'
    ? (u: StyleUnit) => syntaxDistance(target, u, spread)
    : (u: StyleUnit) => delta(target, u)

  return units
    .filter(u => u.kind === 'work' && u.work !== target.work)
    .filter(u => (excludeSameCorpus ? u.corpus !== target.corpus : true))
    .filter(u => (reliableOnly ? u.reliable : true))
    .map(u => ({ unit: u, distance: measure(u) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

export interface FeatureGap {
  feature: StyleFeature
  target: number
  other: number
  /** Difference in units of the feature's own spread — what makes the gap notable, not just big. */
  z: number
}

/** The "why": which features separate two works most, scaled so rare features can still rank. */
export function explain(
  target: StyleUnit,
  other: StyleUnit,
  features: StyleFeature[],
  spread: Record<string, number>,
  limit = 10,
): FeatureGap[] {
  return features
    .map(f => {
      const a = target.rates[f.key] ?? 0
      const b = other.rates[f.key] ?? 0
      return { feature: f, target: a, other: b, z: Math.abs(a - b) / (spread[f.key] || 1) }
    })
    .sort((x, y) => y.z - x.z)
    .slice(0, limit)
}

/** Chunks of one work, for showing that a long work is not stylistically uniform. */
export function chunksOf(work: string, units: StyleUnit[]): StyleUnit[] {
  return units.filter(u => u.kind === 'chunk' && u.work === work).sort((a, b) => a.idx - b.idx)
}

/**
 * Corpus → message key. The corpus name is chrome, so it is translated; the WORK titles are
 * not, beyond the biblical books that book-names.ts already covers — a prose title here is
 * also how the work is cited, and text-names.ts keys those by their last segment with the
 * author stripped, which does not reconstruct "Josephus, Antiquities". English is the
 * documented fallback rather than a half-translated citation.
 */
export const CORPUS_KEY: Record<string, string> = {
  GNT: 'reg.corpus.gnt',
  LXX: 'reg.corpus.lxx',
  josephus: 'reg.corpus.josephus',
  philo: 'reg.corpus.philo',
  'apostolic-fathers': 'reg.corpus.apostolicFathers',
  pseudepigrapha: 'reg.corpus.pseudepigrapha',
  eusebius: 'reg.corpus.eusebius',
  justin: 'reg.corpus.justin',
  greco: 'reg.corpus.greco',
}

/** True for the corpora whose work ids are OSIS book ids, so book-names.ts can localize them. */
export const isBiblical = (corpus: string) => corpus === 'GNT' || corpus === 'LXX'
