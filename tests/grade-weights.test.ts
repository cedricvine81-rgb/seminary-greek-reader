import { normalizeCategoryWeights, weightedOverall } from '@/lib/grade-weights'

describe('grade-weights', () => {
  describe('normalizeCategoryWeights', () => {
    it('keeps positive numeric weights and drops the rest', () => {
      expect(normalizeCategoryWeights({ VOCABULARY_QUIZ: 40, TRANSLATION_EXERCISE: 30, TRANSLATION_EXAM: 30 }))
        .toEqual({ VOCABULARY_QUIZ: 40, TRANSLATION_EXERCISE: 30, TRANSLATION_EXAM: 30 })
    })
    it('ignores zero/negative/non-numeric and unknown keys', () => {
      expect(normalizeCategoryWeights({ VOCABULARY_QUIZ: 50, MORPHOLOGY_QUIZ: 0, TRANSLATION_EXERCISE: -5, FOO: 10 }))
        .toEqual({ VOCABULARY_QUIZ: 50 })
    })
    it('returns null when nothing usable / not an object', () => {
      expect(normalizeCategoryWeights(null)).toBeNull()
      expect(normalizeCategoryWeights({})).toBeNull()
      expect(normalizeCategoryWeights({ MORPHOLOGY_QUIZ: 0 })).toBeNull()
    })
  })

  describe('weightedOverall', () => {
    const w = { VOCABULARY_QUIZ: 40, TRANSLATION_EXERCISE: 30, TRANSLATION_EXAM: 30 }
    it('computes the weighted average of category averages', () => {
      const cats = [
        { type: 'VOCABULARY_QUIZ' as const, avg: 90 },
        { type: 'TRANSLATION_EXERCISE' as const, avg: 80 },
        { type: 'TRANSLATION_EXAM' as const, avg: 70 },
      ]
      // (90*40 + 80*30 + 70*30) / 100 = 81
      expect(weightedOverall(cats, w)).toBe(81)
    })
    it('renormalises over categories that have a score', () => {
      const cats = [
        { type: 'VOCABULARY_QUIZ' as const, avg: 90 },
        { type: 'TRANSLATION_EXERCISE' as const, avg: null },
        { type: 'TRANSLATION_EXAM' as const, avg: 60 },
      ]
      // (90*40 + 60*30) / 70 = 77.14 -> 77
      expect(weightedOverall(cats, w)).toBe(77)
    })
    it('ignores categories with no weight', () => {
      const cats = [
        { type: 'VOCABULARY_QUIZ' as const, avg: 90 },
        { type: 'MORPHOLOGY_QUIZ' as const, avg: 50 },
      ]
      expect(weightedOverall(cats, w)).toBe(90)
    })
    it('returns null when no weighted category has a score', () => {
      expect(weightedOverall([{ type: 'MORPHOLOGY_QUIZ' as const, avg: 80 }], w)).toBeNull()
      expect(weightedOverall([{ type: 'VOCABULARY_QUIZ' as const, avg: null }], w)).toBeNull()
    })
  })
})
