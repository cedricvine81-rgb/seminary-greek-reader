import { normalizeWeights, passageGrade, examTotal, DEFAULT_WEIGHTS } from '@/lib/exam-grading'

describe('exam-grading', () => {
  describe('normalizeWeights', () => {
    it('passes through valid weights', () => {
      expect(normalizeWeights({ parsing: 30, syntax: 30, translation: 40 })).toEqual({ parsing: 30, syntax: 30, translation: 40 })
    })
    it('falls back to defaults for null/empty/all-zero', () => {
      expect(normalizeWeights(null)).toEqual(DEFAULT_WEIGHTS)
      expect(normalizeWeights({})).toEqual(DEFAULT_WEIGHTS)
      expect(normalizeWeights({ parsing: 0, syntax: 0, translation: 0 })).toEqual(DEFAULT_WEIGHTS)
    })
    it('clamps negatives and coerces strings', () => {
      expect(normalizeWeights({ parsing: '20', syntax: -5, translation: 80 })).toEqual({ parsing: 20, syntax: 0, translation: 80 })
    })
  })

  describe('passageGrade', () => {
    const w = { parsing: 25, syntax: 25, translation: 50 }
    it('computes the weighted average of entered sub-scores', () => {
      expect(passageGrade({ parsing: 80, syntax: 80, translation: 90 }, w)).toBe((80 * 25 + 80 * 25 + 90 * 50) / 100)
    })
    it('averages only the entered components', () => {
      // only translation entered -> equals that score
      expect(passageGrade({ translation: 70 }, w)).toBe(70)
      // parsing + syntax (equal weights) -> simple average
      expect(passageGrade({ parsing: 60, syntax: 100 }, w)).toBe(80)
    })
    it('returns null when nothing is entered', () => {
      expect(passageGrade({}, w)).toBeNull()
      expect(passageGrade(null, w)).toBeNull()
    })
    it('passes through a legacy numeric score', () => {
      expect(passageGrade(88, w)).toBe(88)
    })
  })

  describe('examTotal', () => {
    const w = { parsing: 50, syntax: 0, translation: 50 }
    it('averages the per-passage grades', () => {
      const grades = { 'John 1:1': { parsing: 100, translation: 80 }, 'Mark 1:1': { parsing: 60, translation: 60 } }
      // passage 1 = 90, passage 2 = 60 -> 75
      expect(examTotal(grades, w)).toBe(75)
    })
    it('ignores ungraded passages', () => {
      expect(examTotal({ a: { parsing: 90, translation: 90 }, b: {} }, w)).toBe(90)
    })
    it('returns null when nothing is graded', () => {
      expect(examTotal({}, w)).toBeNull()
      expect(examTotal(null, w)).toBeNull()
    })
  })
})
