import { sm2, responseToQuality } from '@/lib/spaced-repetition'

describe('sm2', () => {
  it('gives interval 1 on first repetition (quality ≥ 3)', () => {
    const result = sm2({ easeFactor: 2.5, interval: 1, repetitions: 0, quality: 4 })
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('gives interval 6 on second repetition', () => {
    const result = sm2({ easeFactor: 2.5, interval: 1, repetitions: 1, quality: 4 })
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('resets on quality < 3', () => {
    const result = sm2({ easeFactor: 2.5, interval: 10, repetitions: 5, quality: 1 })
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it('keeps ease factor above 1.3', () => {
    const result = sm2({ easeFactor: 1.4, interval: 1, repetitions: 0, quality: 0 })
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('returns a future nextReviewDate', () => {
    const now = new Date()
    const result = sm2({ easeFactor: 2.5, interval: 1, repetitions: 0, quality: 4 })
    expect(result.nextReviewDate.getTime()).toBeGreaterThan(now.getTime())
  })
})

describe('responseToQuality', () => {
  it('maps know → 4', () => expect(responseToQuality(true)).toBe(4))
  it("maps don't know → 1", () => expect(responseToQuality(false)).toBe(1))
})
