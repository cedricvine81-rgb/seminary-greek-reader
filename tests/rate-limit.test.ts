import { rateLimit, __resetRateLimitStore } from '@/lib/rate-limit'

beforeEach(() => __resetRateLimitStore())

describe('rateLimit', () => {
  it('allows requests up to the limit', () => {
    const r1 = rateLimit('k', 3, 1000)
    const r2 = rateLimit('k', 3, 1000)
    const r3 = rateLimit('k', 3, 1000)
    expect([r1.ok, r2.ok, r3.ok]).toEqual([true, true, true])
    expect(r3.remaining).toBe(0)
  })

  it('blocks the request that exceeds the limit', () => {
    rateLimit('k', 2, 1000)
    rateLimit('k', 2, 1000)
    const blocked = rateLimit('k', 2, 1000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('isolates separate keys', () => {
    rateLimit('a', 1, 1000)
    const b = rateLimit('b', 1, 1000)
    expect(b.ok).toBe(true)
  })

  it('resets after the window elapses', () => {
    jest.useFakeTimers()
    try {
      rateLimit('k', 1, 1000)
      expect(rateLimit('k', 1, 1000).ok).toBe(false)
      jest.advanceTimersByTime(1001)
      expect(rateLimit('k', 1, 1000).ok).toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })
})
