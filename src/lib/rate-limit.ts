/**
 * Minimal in-memory rate limiter (fixed-window).
 *
 * Scope & caveats: state lives in the process, so limits are per serverless
 * instance and reset on cold starts. That's intentionally "good enough" to stop
 * accidental double-submits and casual hammering without adding a dependency.
 * For strict global limits, swap the Map for a shared store (e.g. Upstash Redis)
 * behind the same `rateLimit()` signature.
 */

interface Bucket {
  count: number
  resetAt: number // epoch ms when the window rolls over
}

const buckets = new Map<string, Bucket>()

// Opportunistic cleanup so the Map can't grow unbounded across many keys.
let lastSweep = 0
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  buckets.forEach((b, key) => {
    if (b.resetAt <= now) buckets.delete(key)
  })
}

export interface RateLimitResult {
  /** True if the request is within the limit. */
  ok: boolean
  /** Requests remaining in the current window. */
  remaining: number
  /** Seconds until the window resets (for a Retry-After header). */
  retryAfter: number
}

/**
 * Record a hit for `key` and report whether it's allowed.
 * @param key      Unique bucket key, e.g. `quiz-submit:<userId>`.
 * @param limit    Max requests permitted per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((existing.resetAt - now) / 1000) }
  }

  existing.count += 1
  return { ok: true, remaining: limit - existing.count, retryAfter: 0 }
}

/** Test helper — clears all buckets. */
export function __resetRateLimitStore() {
  buckets.clear()
  lastSweep = 0
}
