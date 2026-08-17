import { resolveHebrewVocabBand } from '@/lib/quiz-generation'

// The 'auto' vocabulary cap on Hebrew morphology quizzes: Glanz assigns 20 words a week
// and the bands are 20 ranks each, so the week number IS the band. Deliberately not
// derived from the course's vocab quizzes — those draw random samples from one fixed
// pool all semester, so they encode no progression to follow.
describe('resolveHebrewVocabBand', () => {
  it('maps week N to Glanz band N', () => {
    expect(resolveHebrewVocabBand(1, 'auto')).toBe('Glanz 1A')
    expect(resolveHebrewVocabBand(2, 'auto')).toBe('Glanz 1B')
    expect(resolveHebrewVocabBand(5, 'auto')).toBe('Glanz 1E')
    expect(resolveHebrewVocabBand(12, 'auto')).toBe('Glanz 1L')
  })

  it('clamps past the last band — late-semester quizzes use the whole Glanz list', () => {
    expect(resolveHebrewVocabBand(13, 'auto')).toBe('Glanz 1L')
    expect(resolveHebrewVocabBand(16, 'auto')).toBe('Glanz 1L')
  })

  it('treats a missing week as week 1, never an out-of-range index', () => {
    expect(resolveHebrewVocabBand(null, 'auto')).toBe('Glanz 1A')
    expect(resolveHebrewVocabBand(undefined, 'auto')).toBe('Glanz 1A')
    expect(resolveHebrewVocabBand(0, 'auto')).toBe('Glanz 1A')
  })

  it('passes an explicit band or no-filter through untouched', () => {
    expect(resolveHebrewVocabBand(3, 'Glanz 1F')).toBe('Glanz 1F')
    expect(resolveHebrewVocabBand(3, null)).toBeNull()
    expect(resolveHebrewVocabBand(3, undefined)).toBeNull()
  })
})
