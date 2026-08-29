/**
 * Dates must render the same wall-clock time everywhere.
 *
 * This is a regression test for a defect that every existing guard was blind to. The
 * formatters called toLocaleDateString with no `timeZone`, so they rendered in whatever zone
 * the runtime was in: Vercel is UTC, students are not. Due dates are stored at 03:59Z —
 * 11:59 pm the previous evening in New York — so every deadline sat across a date boundary,
 * the server rendered "Sep 8" and the browser rendered "Sep 7", and React failed hydration on
 * every assignment row. 40 logged errors against six students before it was found.
 *
 * Nothing caught it because nothing was wrong with the code in isolation: tsc passed, the i18n
 * audit passed, the route rendered 200. It only failed when two runtimes in different zones
 * rendered the same instant. That is exactly what this test does.
 */
import { formatDate, formatDateShort, formatDateLong, formatDateTime, COURSE_TIME_ZONE } from '@/lib/i18n/format'

// Real FA26 deadlines: one in daylight time, one after the November switch to standard time.
const EDT_DEADLINE = new Date('2026-09-08T03:59:00.000Z') // 11:59 pm Mon 7 Sep, New York
const EST_DEADLINE = new Date('2026-11-03T04:59:00.000Z') // 11:59 pm Mon 2 Nov, New York

const ZONES = ['UTC', 'America/New_York', 'Europe/Madrid', 'Asia/Tokyo', 'Pacific/Auckland']

/** Run a formatter as if the process were in `tz`. */
function inZone<T>(tz: string, fn: () => T): T {
  const prev = process.env.TZ
  process.env.TZ = tz
  try { return fn() } finally { process.env.TZ = prev }
}

describe('date formatting is zone-independent', () => {
  const formatters: [string, (d: Date, l: string) => string][] = [
    ['formatDate', formatDate],
    ['formatDateShort', formatDateShort],
    ['formatDateLong', formatDateLong],
    ['formatDateTime', formatDateTime],
  ]

  for (const [name, fn] of formatters) {
    for (const [label, deadline] of [['EDT', EDT_DEADLINE], ['EST', EST_DEADLINE]] as const) {
      it(`${name} renders one string for ${label} across every runtime zone`, () => {
        const rendered = ZONES.map(tz => inZone(tz, () => fn(deadline, 'en')))
        // Every zone must agree — that agreement is what stops the hydration mismatch.
        expect(new Set(rendered).size).toBe(1)
      })
    }
  }

  it('renders the deadline as the instructor set it: 11:59 pm, not the following morning', () => {
    // The bug's signature was the date rolling forward on the server. If these ever read
    // "Sep 8" / "Nov 3", the timeZone has been dropped again.
    expect(formatDate(EDT_DEADLINE, 'en')).toBe('Sep 7, 2026')
    expect(formatDate(EST_DEADLINE, 'en')).toBe('Nov 2, 2026')
    expect(formatDateTime(EDT_DEADLINE, 'en')).toContain('11:59')
    expect(formatDateTime(EST_DEADLINE, 'en')).toContain('11:59')
  })

  it('still follows the reader\'s language, only not their clock', () => {
    // Pinning the zone must not pin the locale: Spanish writes the month differently.
    expect(formatDate(EDT_DEADLINE, 'en')).not.toBe(formatDate(EDT_DEADLINE, 'es'))
    expect(formatDate(EDT_DEADLINE, 'es')).toMatch(/sep/i)
  })

  it('uses a named zone, so daylight saving is handled rather than frozen', () => {
    // A fixed offset like "EST" or "-05:00" would be an hour out for half the semester —
    // these two deadlines are stored an hour apart in UTC precisely because of the switch.
    expect(COURSE_TIME_ZONE).toBe('America/New_York')
    expect(EST_DEADLINE.getTime() - EDT_DEADLINE.getTime()).toBe(
      // 56 days apart, plus the extra hour the clocks gained
      56 * 24 * 3600_000 + 3600_000,
    )
  })
})
