/**
 * The arithmetic behind the /admin/health probe, kept OUT of the component so it can be tested.
 *
 * It lives here because this logic has now been wrong twice in ways nothing caught: a ratio test
 * that cried wolf when every response was already instant, and a hard-coded two-element lookup
 * that threw as soon as a third row was added. Neither was reachable by tsc or by the build, and
 * both shipped. A pure function with a test is the fix for that, not more care.
 */

export interface Sample { ms: number; ok: boolean; fromCache: boolean; edge: string | null }
export interface Phase { label: string; note: string; samples: Sample[] }

export interface PhaseStat {
  label: string
  note: string
  p50: number
  /** The genuine slowest request, which is what the UI calls it. */
  max: number
  failed: number
  cached: number
  edgeHits: number
}

export type Tone = 'good' | 'watch' | 'bad'
export interface ProbeSummary {
  rows: PhaseStat[]
  /** Widest single request, for scaling the bars. Never zero. */
  scale: number
  verdict: { tone: Tone; text: string }
  /**
   * A second sentence about any phase the verdict does not judge. Searching is excluded from the
   * caching comparison on purpose, but staying silent about it let the summary announce that
   * everything was instant while a search had just taken three seconds. A health check must not
   * describe a measurement it is ignoring as though it had passed.
   */
  aside?: string
}

/** At or under this many ms, a reader perceives no wait at all. */
export const INSTANT = 50
/** Above this AND with no speed-up, caching is genuinely suspect. */
export const SLOW = 200
/** A search slower than this is worth naming — it is the library index loading. */
export const SEARCH_SLOW = 500

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  return sortedAsc[Math.min(sortedAsc.length - 1, Math.floor((sortedAsc.length - 1) * p))]
}

function stat(ph: Phase): PhaseStat {
  const times = ph.samples.map(s => s.ms).sort((a, b) => a - b)
  return {
    label: ph.label,
    note: ph.note,
    p50: percentile(times, 0.5),
    // The maximum, not a p95: with six samples a floor-based p95 is not the slowest request,
    // and the interface calls this "slowest". Better to show the number the label promises.
    max: times.length ? times[times.length - 1] : 0,
    failed: ph.samples.filter(s => !s.ok).length,
    cached: ph.samples.filter(s => s.fromCache).length,
    edgeHits: ph.samples.filter(s => s.edge === 'HIT').length,
  }
}

/**
 * Turn raw timings into rows and a verdict.
 *
 * The first two guards exist because a ratio between two tiny numbers measures noise: with a 4 ms
 * baseline, comparing 4 ms to 3 ms found no 3x speed-up and announced that caching had broken, on
 * a system that was answering perfectly. A ratio only means something once there is a delay worth
 * removing, so absolute speed is decided first.
 *
 * The SLOW guard exists because the first attempt at that fix traded the false alarm for a false
 * reassurance — genuinely broken caching at 900 ms reported "healthy" because the threshold sat
 * at 1000 ms. A check that stays quiet while something is wrong is the worse failure.
 *
 * `fresh` is the first phase and `repeat` the second; any further phases (searching) are reported
 * but do not enter the caching comparison, because they measure something else entirely.
 */
export function summariseProbe(phases: Phase[], budget: number): ProbeSummary {
  const rows = phases.map(stat)
  const scale = Math.max(1, ...rows.map(r => r.max))
  const failed = rows.reduce((n, r) => n + r.failed, 0)

  const fresh = rows[0]
  const repeat = rows[1]
  const search = rows[2]
  if (!fresh || !repeat) {
    return { rows, scale, verdict: { tone: 'good', text: 'Not enough measurements to draw a conclusion.' } }
  }

  const speedup = repeat.p50 > 0 ? fresh.p50 / repeat.p50 : 0
  const verdict: ProbeSummary['verdict'] =
    failed > 0
      ? { tone: 'bad', text: `${failed} of ${budget} requests failed. That is worth investigating — check Errors.` }
      : repeat.p50 <= INSTANT && fresh.p50 <= INSTANT
      ? { tone: 'good', text: 'Chapters came back in a few milliseconds — far faster than anyone can perceive. Nothing to do.' }
      : speedup >= 3
      ? { tone: 'good', text: `Opening the same chapter again was about ${Math.round(speedup)}x faster. Caching is doing its job — the second student to open a passage gets it almost instantly.` }
      : repeat.p50 > SLOW
      ? { tone: 'watch', text: `Re-opening the same chapter took about ${Math.round(repeat.p50)} ms and was no faster than opening a new one. That combination usually means caching has stopped working — worth raising with your developer.` }
      : { tone: 'good', text: 'Responses are quick. Re-opening was not dramatically faster, but at these speeds there is nothing to gain — the app is answering well within what anyone notices.' }

  // Name a slow search rather than letting the chapter verdict speak for it.
  // Do NOT call this a first-search warm-up. Measured in production across repeated runs minutes
  // apart, it stayed slow every time — and locally, where one process serves everything, repeat
  // searches take ~10 ms. The index is held per serverless instance, and while the app is quiet
  // those instances are recycled between visits, so a search usually lands on a cold one. It is
  // the common case at low traffic, not a rare first hit, and it eases as usage grows.
  const aside = search && search.p50 > SEARCH_SLOW
    ? `Searching took about ${(search.p50 / 1000).toFixed(1)} seconds. The word list it needs is held by whichever server answers, and while the app is quiet those servers are replaced between visits — so most searches pay this, not just the first one of the day. It slows searching only, never reading, and it eases as more people use the app and the servers stay busy.`
    : undefined

  return { rows, scale, verdict, aside }
}
