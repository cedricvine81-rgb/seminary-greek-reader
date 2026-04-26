/**
 * SM-2 spaced repetition algorithm.
 * Returns updated interval, ease factor, repetitions, and next review date.
 */
export interface SM2Input {
  easeFactor: number
  interval: number
  repetitions: number
  quality: 0 | 1 | 2 | 3 | 4 | 5
}

export interface SM2Output {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

export function sm2(input: SM2Input): SM2Output {
  const { quality } = input
  let { easeFactor, interval, repetitions } = input

  if (quality >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    repetitions += 1
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  if (easeFactor < 1.3) easeFactor = 1.3

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return { easeFactor, interval, repetitions, nextReviewDate }
}

/** Map a KNOW/DONT_KNOW answer to an SM-2 quality score */
export function responseToQuality(knew: boolean): SM2Input['quality'] {
  return knew ? 4 : 1
}
