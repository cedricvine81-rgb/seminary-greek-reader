import { sm2 } from '@/lib/spaced-repetition'

describe('flashcard spaced repetition integration', () => {
  it('builds a 5-session schedule', () => {
    let state = { easeFactor: 2.5, interval: 1, repetitions: 0 }
    const schedule: number[] = []

    for (let i = 0; i < 5; i++) {
      const result = sm2({ ...state, quality: 4 })
      schedule.push(result.interval)
      state = { easeFactor: result.easeFactor, interval: result.interval, repetitions: result.repetitions }
    }

    // Intervals should grow: 1, 6, then multiplied by ease factor
    expect(schedule[0]).toBe(1)
    expect(schedule[1]).toBe(6)
    expect(schedule[2]).toBeGreaterThan(6)
    expect(schedule[4]).toBeGreaterThan(schedule[3])
  })

  it('resets after a wrong answer', () => {
    const after5 = sm2({ easeFactor: 2.5, interval: 15, repetitions: 5, quality: 4 })
    const afterWrong = sm2({ ...after5, quality: 1 })
    expect(afterWrong.interval).toBe(1)
    expect(afterWrong.repetitions).toBe(0)
  })
})
