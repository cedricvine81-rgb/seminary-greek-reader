/**
 * Search utility tests (unit — no DB).
 * Integration tests requiring a real DB are run separately (e.g. `npm run test:int`).
 */
import { SAMPLE_JOHN_1 } from '@/data/sample-reader-data'

describe('sample data sanity checks', () => {
  it('has at least 5 verses of John 1', () => {
    expect(SAMPLE_JOHN_1.length).toBeGreaterThanOrEqual(5)
  })

  it('each verse has a non-empty text', () => {
    for (const v of SAMPLE_JOHN_1) {
      expect(v.text.length).toBeGreaterThan(0)
    }
  })

  it('references are formatted correctly', () => {
    for (const v of SAMPLE_JOHN_1) {
      expect(v.reference).toMatch(/^John \d+:\d+$/)
    }
  })
})
