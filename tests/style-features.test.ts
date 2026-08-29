/**
 * The lemma canonicalization that makes cross-corpus comparison honest.
 *
 * The Register tool's primary lens compares lemma frequencies across nine corpora produced by
 * three different tagging regimes. Where those regimes disagree about what the lemma IS, the
 * difference reads as style and is not. Each fold below was found by measuring a complementary
 * distribution across the corpora — where one form appears, the other is absent — and each is
 * pinned here because the failure it prevents is invisible: the numbers stay plausible.
 */
import { DELTA_EXCLUDE, canonLemma, profileWords, type Word } from '@/lib/style-features'

const w = (lemma: string, parsing = 'noun, singular, nominative'): Word => ['0', lemma, parsing]

describe('lemma canonicalization', () => {
  it('folds the Attic and Koine spellings of γίγνομαι together', () => {
    // The hand-tagged New Testament says γινομαι; Stanza, trained on Attic, says γιγνομαι.
    // Both are G1096. Unfolded, this was the largest reported gap between Tobit and Mark.
    expect(canonLemma('γιγνομαι')).toBe('γινομαι')
    expect(canonLemma('γινομαι')).toBe('γινομαι')
  })

  it('folds οὕτω and οὕτως together', () => {
    expect(canonLemma('ουτω')).toBe('ουτως')
  })

  it.each([
    ['αλλ', 'αλλα'], ['δι', 'δια'], ['ουδ', 'ουδε'], ['μηδ', 'μηδε'],
    ['επ', 'επι'], ['εφ', 'επι'], ['υπ', 'υπο'], ['υφ', 'υπο'],
    ['κατ', 'κατα'], ['καθ', 'κατα'], ['μετ', 'μετα'], ['μεθ', 'μετα'],
    ['απ', 'απο'], ['αφ', 'απο'],
  ])('folds the elided %s onto %s', (from, to) => {
    expect(canonLemma(from)).toBe(to)
  })

  it('leaves an ordinary lemma alone', () => {
    expect(canonLemma('λογος')).toBe('λογος')
  })

  it('counts a folded lemma under its canonical form when profiling', () => {
    const p = profileWords([w('γιγνομαι'), w('γινομαι'), w('αλλ'), w('αλλα')])
    expect(p.lem.get('γινομαι')).toBe(2)
    expect(p.lem.get('γιγνομαι')).toBeUndefined()
    expect(p.lem.get('αλλα')).toBe(2)
  })

  it('counts γίγνομαι toward the καὶ ἐγένετο feature, which is the point of the fold', () => {
    // The feature tests for γινομαι. Before the fold it scored zero everywhere outside the
    // New Testament — nil in the Septuagint, whose narrative it exists to detect.
    const attic = profileWords([w('γιγνομαι', 'verb, aorist, indicative'), w('λογος')])
    expect(attic.rates.egeneto).toBe(500)
  })

  it('keeps the tagger-artifact lemmas out of the Delta dimensions', () => {
    expect(DELTA_EXCLUDE.has('')).toBe(true)      // a word the tagger failed on
    expect(DELTA_EXCLUDE.has('ιημι')).toBe(true)  // Stanza's bin for what it cannot place
  })
})
