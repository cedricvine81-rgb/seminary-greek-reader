import { hebrewWeekBand, hebrewStrongsForSelections } from '@/lib/quiz-generation'
import { HEBREW_DECK, strongsThroughBand } from '@/lib/vocab-decks'

// The 'auto' vocabulary cap on Hebrew morphology quizzes. resolveHebrewVocabCap follows
// the course's own vocab quizzes (union of their stored selections — schedule-agnostic);
// these are its two pure halves. The DB-reading wrapper is exercised by the API probes.
describe('hebrewWeekBand (the no-vocab-quizzes fallback)', () => {
  it('maps week N to Glanz band N', () => {
    expect(hebrewWeekBand(1)).toBe('Glanz 1A')
    expect(hebrewWeekBand(2)).toBe('Glanz 1B')
    expect(hebrewWeekBand(12)).toBe('Glanz 1L')
  })
  it('clamps past the last band and treats a missing week as week 1', () => {
    expect(hebrewWeekBand(16)).toBe('Glanz 1L')
    expect(hebrewWeekBand(null)).toBe('Glanz 1A')
    expect(hebrewWeekBand(0)).toBe('Glanz 1A')
  })
})

describe('hebrewStrongsForSelections (taught-so-far from vocab quizzes)', () => {
  it('unions weekly Glanz slices into the cumulative band coverage', () => {
    const set = hebrewStrongsForSelections([['Glanz 1A'], ['Glanz 1B']])
    expect(set).not.toBeNull()
    // identical to the cumulative through-band set the band cap would use
    expect(set).toEqual(strongsThroughBand(HEBREW_DECK, 'Glanz 1B'))
  })
  it('accepts §-section slices — the sections schedule counts too', () => {
    const set = hebrewStrongsForSelections([['1-A'], ['1-B']])
    expect(set).not.toBeNull()
    expect(set!.size).toBeGreaterThan(30)   // two 20-word slices, minus homographs
  })
  it('mixes both groupings, as a manual selection may', () => {
    const glanz = hebrewStrongsForSelections([['Glanz 1A']])!
    const mixed = hebrewStrongsForSelections([['Glanz 1A'], ['1-B']])!
    expect(mixed.size).toBeGreaterThan(glanz.size)
  })
  it('returns null when there is nothing to derive a cap from', () => {
    expect(hebrewStrongsForSelections([])).toBeNull()
    expect(hebrewStrongsForSelections([[], []])).toBeNull()
  })
})
