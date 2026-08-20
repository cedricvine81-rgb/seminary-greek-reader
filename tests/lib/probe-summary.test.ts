import { summariseProbe, INSTANT, SLOW, percentile, type Phase } from '@/lib/probe-summary'

// Both bugs this file exists to prevent shipped past tsc and past a clean production build:
// a ratio test that cried wolf on a healthy system, and a row/stat lookup that threw once a
// third phase was added. Each has a test named after it.

const phase = (label: string, ms: number[], opts: { failed?: number } = {}): Phase => ({
  label,
  note: '',
  samples: ms.map((m, i) => ({
    ms: m,
    ok: i >= (opts.failed ?? 0),
    fromCache: false,
    edge: null,
  })),
})

const run = (freshMs: number[], repeatMs: number[], searchMs: number[] = [100, 120], opts = {}) =>
  summariseProbe(
    [phase('Opening new chapters', freshMs, opts), phase('Re-opening the same chapter', repeatMs), phase('Searching the library', searchMs)],
    14,
  )

describe('summariseProbe — rows', () => {
  // THE 500. The component destructured three phases but looked their stats up from a
  // two-element array, so the searches row resolved to undefined and threw on first render.
  it('returns a stat for every phase, including the third', () => {
    const { rows } = run([10, 12], [3, 4], [900, 1600])
    expect(rows).toHaveLength(3)
    expect(rows.map(r => r.label)).toEqual([
      'Opening new chapters', 'Re-opening the same chapter', 'Searching the library',
    ])
    for (const r of rows) expect(Number.isFinite(r.p50) && Number.isFinite(r.max)).toBe(true)
  })

  it('scales bars to the slowest single request across all phases, never zero', () => {
    expect(run([10], [3], [1600]).scale).toBe(1600)
    expect(run([0], [0], [0]).scale).toBe(1)
  })

  it('survives a phase with no samples', () => {
    const { rows, verdict } = summariseProbe([phase('a', []), phase('b', [])], 14)
    expect(rows.every(r => r.p50 === 0)).toBe(true)
    expect(verdict.tone).toBe('good')
  })

  it('reports fewer than two phases without throwing', () => {
    expect(summariseProbe([], 14).verdict.tone).toBe('good')
    expect(summariseProbe([phase('only', [5])], 14).rows).toHaveLength(1)
  })
})

describe('summariseProbe — verdict', () => {
  // THE FALSE ALARM. 4 ms vs 3 ms is not a 3x speed-up, but there is nothing left to speed up.
  it('calls an all-instant run healthy, however small the ratio', () => {
    const v = run([4, 4, 5], [3, 3, 4]).verdict
    expect(v.tone).toBe('good')
    expect(v.text).toMatch(/few milliseconds/)
  })

  it('reports a real speed-up as caching working', () => {
    const v = run([220, 240], [18, 20]).verdict
    expect(v.tone).toBe('good')
    expect(v.text).toMatch(/12x faster|caching is doing its job/i)
  })

  // THE FALSE REASSURANCE. Slow AND no speed-up must never read as healthy.
  it.each([[900, 880], [300, 290], [2400, 2300]])(
    'warns when repeats are slow with no speed-up (%i ms vs %i ms)',
    (fresh, repeat) => {
      const v = run([fresh, fresh], [repeat, repeat]).verdict
      expect(v.tone).toBe('watch')
      expect(v.text).toMatch(/caching has stopped working/)
    },
  )

  it('reports failures above everything else', () => {
    const v = run([4, 4], [3, 3], [100, 100], { failed: 2 }).verdict
    expect(v.tone).toBe('bad')
    expect(v.text).toMatch(/2 of 14 requests failed/)
  })

  it('does not warn just above INSTANT when there is nothing to gain', () => {
    expect(run([60, 60], [55, 55]).verdict.tone).toBe('good')
  })

  it('ignores the searches phase when judging caching', () => {
    // A slow first search must not, on its own, make the verdict negative.
    const v = run([4, 4], [3, 3], [2100, 2200]).verdict
    expect(v.tone).toBe('good')
  })

  it('treats the thresholds as the boundaries they claim to be', () => {
    expect(run([INSTANT, INSTANT], [INSTANT, INSTANT]).verdict.tone).toBe('good')
    expect(run([SLOW + 1, SLOW + 1], [SLOW + 1, SLOW + 1]).verdict.tone).toBe('watch')
  })
})

describe('percentile', () => {
  it('handles an empty set and picks from a sorted one', () => {
    expect(percentile([], 0.5)).toBe(0)
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2)
  })
})

describe('what the rows report', () => {
  it('reports the true slowest request, since that is what the label says', () => {
    const { rows } = run([10, 12, 14, 1600], [3, 4])
    expect(rows[0].max).toBe(1600)   // a floor-based p95 over four samples would say 14
  })
})
