'use client'

import { useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { summariseProbe, type Phase, type Sample } from '@/lib/probe-summary'

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
  const [phases, setPhases] = useState<Phase[] | null>(null)
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
        { label: 'Searching the library', note: 'held per server, so a quiet app usually pays for loading it again', samples: search },
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
          Two of them are searches, which load the library word list on whichever server answers.
        </p>
      </div>

      {ranAt && <p className="text-xs text-gray-400">Last run {ranAt}</p>}

      {phases && (() => {
        const { rows, scale, verdict, aside } = summariseProbe(phases, BUDGET)
        const TONE = { good: 'text-green-700', watch: 'text-amber-700', bad: 'text-red-700' }
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {rows.map(r => (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-800">{r.label}</span>
                    <span className="flex-none tabular-nums text-gray-500">
                      {Math.round(r.p50)} ms typical
                      <span className="text-gray-400"> · {Math.round(r.max)} ms slowest</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-brand-600"
                      style={{ width: `${Math.max(1.5, (r.max / scale) * 100)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {r.note}
                    {r.cached > 0 ? ` · ${r.cached} answered from your browser's own cache` : ''}
                    {r.edgeHits > 0 ? ` · ${r.edgeHits} from the edge cache` : ''}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className={`text-sm leading-relaxed ${TONE[verdict.tone]}`}>{verdict.text}</p>
              {aside && <p className="text-sm leading-relaxed text-gray-500">{aside}</p>}
            </div>
          </div>
        )
      })()}

    </div>
  )
}
