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
const BUDGET = 14
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
  '/api/search/backgrounds?q=sacerdote&lang=es',
  '/api/search/backgrounds?q=priest&lang=en',
]
const WARM_URL = '/api/reader?corpus=GNT&book=John&chapter=3'

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
      const cold = await runPool(COLD_URLS.slice(0, BUDGET - 6))
      const warm = await runPool(Array.from({ length: 6 }, () => WARM_URL))
      setPhases([
        { label: 'Opening new chapters', note: 'eight different passages, none of them seen before', samples: cold },
        { label: 'Re-opening the same chapter', note: 'the same passage six times, as a second student would', samples: warm },
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
        const [fresh, repeat] = phases.map(stat)
        const scale = Math.max(fresh.p95, repeat.p95, 1)
        const failed = fresh.failed + repeat.failed
        const speedup = repeat.p50 > 0 ? fresh.p50 / repeat.p50 : 0

        // The verdict is the point of the two phases. Written from the measurement, because a
        // reader should not have to know what "p95" means to learn whether anything is wrong.
        const verdict = failed > 0
          ? { tone: 'bad' as const, text: `${failed} of ${BUDGET} requests failed. That is worth investigating — check Errors.` }
          : fresh.p95 > 3000
          ? { tone: 'watch' as const, text: 'Pages took over three seconds to arrive. Usually the first visit after a quiet spell; run it again and see whether it settles.' }
          : speedup >= 3
          ? { tone: 'good' as const, text: `Opening the same chapter again was about ${Math.round(speedup)}× faster. Caching is doing its job — the second student to open a passage gets it almost instantly.` }
          : { tone: 'watch' as const, text: 'Re-opening the same chapter was no faster than a new one. That normally means caching has stopped working — worth raising with your developer.' }

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
