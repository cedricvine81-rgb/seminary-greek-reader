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
        { label: 'Distinct chapters', note: 'each a different URL — the full path, edge and function', samples: cold },
        { label: 'Same chapter, repeated', note: 'should be far faster if caching is working', samples: warm },
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

      {phases && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-medium">Phase</th>
                <th className="py-2 pr-4 text-right font-medium">p50</th>
                <th className="py-2 pr-4 text-right font-medium">p95</th>
                <th className="py-2 pr-4 text-right font-medium">Max</th>
                <th className="py-2 pr-4 text-right font-medium">Failed</th>
                <th className="py-2 font-medium">Served from</th>
              </tr>
            </thead>
            <tbody>
              {phases.map(ph => {
                const times = ph.samples.map(s => s.ms).sort((a, b) => a - b)
                const failed = ph.samples.filter(s => !s.ok).length
                const browserCached = ph.samples.filter(s => s.fromCache).length
                const edgeHits = ph.samples.filter(s => s.edge === 'HIT').length
                const served = [
                  browserCached > 0 ? `${browserCached} browser cache` : null,
                  edgeHits > 0 ? `${edgeHits} edge HIT` : null,
                ].filter(Boolean).join(' · ')
                return (
                  <tr key={ph.label} className="border-b border-gray-100 align-baseline">
                    <td className="py-2 pr-4">
                      <span className="font-medium text-gray-900">{ph.label}</span>
                      <span className="block text-xs text-gray-500">{ph.note}</span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{Math.round(pct(times, 0.5))} ms</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{Math.round(pct(times, 0.95))} ms</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{Math.round(times[times.length - 1] ?? 0)} ms</td>
                    <td className={`py-2 pr-4 text-right tabular-nums ${failed ? 'font-semibold text-red-600' : 'text-gray-400'}`}>{failed}</td>
                    <td className="py-2 text-xs text-gray-500">{served || 'network'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">
            On localhost there is no edge, so &quot;edge HIT&quot; only appears in production. A repeated
            chapter that is not far faster than a distinct one means the Cache-Control headers on
            /api/reader have regressed.
          </p>
        </div>
      )}
    </div>
  )
}
