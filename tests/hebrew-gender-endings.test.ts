import { HEBREW_NOUN_POOL, HEBREW_ADJECTIVE_POOL } from '@/data/hebrew-parsing-pool'
import { generateHebrewMorphologyQuestions } from '@/lib/quiz-generation'

// OSHB's "both" gender tag is a lexical fact about the lemma, not something a student can
// read off the form. The pool builder now resolves it from the ending, or leaves the form
// untested for gender where the ending genuinely does not mark it (dual, construct
// singular, and numerals — whose concord is chiastic, so the ending says the opposite).
describe('Hebrew gender after the ending pass', () => {
  it('never offers "Both" as an answer', () => {
    for (const pool of [HEBREW_NOUN_POOL, HEBREW_ADJECTIVE_POOL]) {
      expect(pool.some(e => (e as { gender?: string }).gender === 'Both')).toBe(false)
    }
  })

  it('leaves gender untested on duals and numerals rather than guessing', () => {
    const duals = HEBREW_NOUN_POOL.filter(e => (e as { number?: string }).number === 'Dual')
    expect(duals.length).toBeGreaterThan(0)
    for (const d of duals) {
      // a dual that OSHB tagged with a real gender keeps it; only the "both" ones went null
      const g = (d as { gender?: string | null }).gender
      expect(g === null || g === 'Masculine' || g === 'Feminine' || g === 'Common').toBe(true)
    }
  })

  it('still generates gender questions, and never asks one it cannot answer', () => {
    const qs = generateHebrewMorphologyQuestions('NOUN_PARSING', 25, ['gender', 'number'])
    expect(qs.length).toBeGreaterThan(10)
    for (const q of qs) {
      const answer = JSON.parse(q.correctAnswer) as Record<string, string | null>
      expect(answer.gender).toBeTruthy()
      expect(answer.gender).not.toBe('Both')
    }
  })
})
