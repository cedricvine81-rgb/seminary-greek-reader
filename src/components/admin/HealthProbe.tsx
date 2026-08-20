'use client'

import { useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'

/**
 * A bounded latency probe, run FROM THE ADMIN'S BROWSER rather than from the server.
 *
 * That is the important design choice. Traffic generated inside a Vercel function would compete
 * for the capacity it is trying to measure, could not outlive the function timeout, and would
 * originate inside Vercel's own network — so it would never cross the edge cache that a real
 * reader goes through, and the caching on /api/reader would look like it did nothing. Firing
 * from the browser measures the path an actual student takes, end to end.
 *
 * This measures LATENCY, not capacity. It is deliberately tiny (see BUDGET) — a health check you
 * can click during a lecture, not a load test. Real load has to be driven from outside the app.
 */

// Total requests per run, hard-capped so this can never become a traffic amplifier.
const BUDGET = 14   // 6 chapter reads + 6 repeats + 2 searches
const CONCURRENCY = 4

interface Sample { ms: number; ok: boolean; fromCache: boolean; edge: string | null }
interface PhaseResult { label: string; note: string; samples: Sample[] }

const COLD_URLS = [
  '/api/reader?corpus=GNT&book=John&chapter=1',
  '/api/reader?corpus=GNT&book=Rom&chapter=8',
  '/api/reader?corpus=LXX&book=Gen&chapter=1',
  '/api/reader?corpus=GNT&book=Matt&chapter=5',
  '/api/translation?book=John&chapter=1&lang=en',
  '/api/translation?book=Rom&chapter=8&lang=en',
]
const WARM_URL = '/api/reader?corpus=GNT&book=John&chapter=3'
// Searches get their own row. They behave nothing like a chapter read — the first one after a
// quiet period builds the library index and takes a second or two — so averaging them in made a
// perfectly healthy set of chapter reads report a 1.7-second worst case.
const SEARCH_URLS = [
  '/api/search/backgrounds?q=sacerdote&lang=es',
  '/api/search/backgrounds?q=priest&lang=en',
]

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))]
}

async function timeOne(url: string): Promise<Sample> {
  const started = performance.now()
  try {
    const res = await fetch(url, { credentials: 'same-origin' })
    await res.arrayBuffer()                       // include transfer, not just headers
    const ms = performance.now() - started
    // transferSize 0 with a non-zero body means the browser answered from its own cache —
    // a correct observation, and the thing that proves max-age is being honoured.
    const entry = performance.getEntriesByName(new URL(url, location.origin).href).pop() as
      PerformanceResourceTiming | undefined
    return {
      ms,
      ok: res.ok,
      fromCache: !!entry && entry.transferSize === 0 && entry.decodedBodySize > 0,
      edge: res.headers.get('x-vercel-cache'),
    }
  } catch {
    return { ms: performance.now() - started, ok: false, fromCache: false, edge: null }
  }
}

async function runPool(urls: string[]): Promise<Sample[]> {
  const out: Sample[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
      for (;;) {
        const i = next++
        if (i >= urls.length) return
        out.push(await timeOne(urls[i]))
      }
    }),
  )
  return out
}

export function HealthProbe() {
  const [running, setRunning] = useState(false)
  const [phases, setPhases] = useState<PhaseResult[] | null>(null)
  const [ranAt, setRanAt] = useState<string | null>(null)

  async function run() {
    setRunning(true)
    setPhases(null)
    try {
      const cold = await runPool(COLD_URLS)
      const warm = await runPool(Array.from({ length: 6 }, () => WARM_URL))
      const search = await runPool(SEARCH_URLS)
      setPhases([
        { label: 'Opening new chapters', note: 'six different passages, none of them seen before', samples: cold },
        { label: 'Re-opening the same chapter', note: 'the same passage six times, as a second student would', samples: warm },
        { label: 'Searching the library', note: 'the first search after a quiet spell loads the word list, so it is slower', samples: search },
      ])
      setRanAt(new Date().toLocaleTimeString())
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {running ? <Loader2 size={15} className="animate-spin" /> : <Activity size={15} />}
          {running ? 'Probing…' : 'Run probe'}
        </button>
        <p className="text-xs text-gray-500">
          {BUDGET} requests from this browser. Measures how fast the app answers right now — not how much it can take.
          Two of them are searches, which warm the library index on whichever instance answers, so a second run reads faster.
        </p>
      </div>

      {ranAt && <p className="text-xs text-gray-400">Last run {ranAt}</p>}

      {phases && (() => {
        const stat = (ph: PhaseResult) => {
          const times = ph.samples.map(s => s.ms).sort((a, b) => a - b)
          return {
            p50: pct(times, 0.5),
            p95: pct(times, 0.95),
            failed: ph.samples.filter(s => !s.ok).length,
            cached: ph.samples.filter(s => s.fromCache).length,
            edgeHits: ph.samples.filter(s => s.edge === 'HIT').length,
          }
        }
        const [fresh, repeat, search] = phases.map(stat)
        const scale = Math.max(fresh.p95, repeat.p95, search.p95, 1)
        const failed = fresh.failed + repeat.failed + search.failed
        const speedup = repeat.p50 > 0 ? fresh.p50 / repeat.p50 : 0

        // The verdict, written from the measurement. Order matters, and the first two guards are
        // here because of a false alarm: with a 4 ms baseline the ratio test compared 4 ms to
        // 3 ms, found no 3x speed-up, and reported that caching had broken — when in fact
        // everything was already being served instantly and there was nothing left to speed up.
        // A ratio is only meaningful once there is a delay worth removing, so absolute speed is
        // checked first. Dividing two tiny numbers measures noise.
        const INSTANT = 50    // ms — at or under this, the reader perceives no wait at all
        const SLOW = 200      // ms — above this AND with no speed-up, caching is genuinely suspect
        const verdict = failed > 0
          ? { tone: 'bad' as const, text: `${failed} of ${BUDGET} requests failed. That is worth investigating — check Errors.` }
          : repeat.p50 <= INSTANT && fresh.p50 <= INSTANT
          ? { tone: 'good' as const, text: `Everything came back in a few milliseconds — far faster than anyone can perceive. Nothing to do.` }
          : speedup >= 3
          ? { tone: 'good' as const, text: `Opening the same chapter again was about ${Math.round(speedup)}x faster. Caching is doing its job — the second student to open a passage gets it almost instantly.` }
          : repeat.p50 > SLOW
          ? { tone: 'watch' as const, text: `Re-opening the same chapter took about ${Math.round(repeat.p50)} ms and was no faster than opening a new one. That combination usually means caching has stopped working — worth raising with your developer.` }
          : { tone: 'good' as const, text: 'Responses are quick. Re-opening was not dramatically faster, but at these speeds there is nothing to gain — the app is answering well within what anyone notices.' }

        const TONE = { good: 'text-green-700', watch: 'text-amber-700', bad: 'text-red-700' }

        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {phases.map((ph, i) => {
                const st = [fresh, repeat][i]
                return (
                  <div key={ph.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-800">{ph.label}</span>
                      <span className="flex-none tabular-nums text-gray-500">
                        {Math.round(st.p50)} ms typical
                        <span className="text-gray-400"> · {Math.round(st.p95)} ms slowest</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand-600"
                        style={{ width: `${Math.max(1.5, (st.p95 / scale) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {ph.note}
                      {st.cached > 0 ? ` · ${st.cached} answered from your browser's own cache` : ''}
                      {st.edgeHits > 0 ? ` · ${st.edgeHits} from the edge cache` : ''}
                    </p>
                  </div>
                )
              })}
            </div>
            <p className={`text-sm leading-relaxed ${TONE[verdict.tone]}`}>{verdict.text}</p>
          </div>
        )
      })()}

    </div>
  )
}
