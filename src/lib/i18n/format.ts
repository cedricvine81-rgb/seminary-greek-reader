/**
 * Date formatting that follows the interface language.
 *
 * Two things were forcing English regardless of the reader's locale: an explicit
 * `toLocaleDateString('en-US', …)`, and date-fns `format(d, 'MMM d, yyyy')`, whose pattern is
 * an English pattern — "Aug 10, 2026" is not merely English words in a neutral order, it is an
 * English ORDER, and Spanish writes "10 ago 2026".
 *
 * Intl gets the order right per locale, so these take a locale and a shape rather than a
 * pattern. Deliberately plain option sets: an earlier bug in this app came from an option
 * combination Chrome tolerated and Safari did not (dateStyle together with timeZoneName), and
 * students here use both.
 *
 * ── Why every one of these pins a time zone ──────────────────────────────────────────────
 *
 * Without `timeZone`, Intl formats in whatever zone the RUNTIME is in. Vercel runs UTC and the
 * students do not, and due dates are stored at 03:59Z — 11:59 pm the previous evening in New
 * York — so every deadline sits across a date boundary. The server rendered "Sep 8" and the
 * browser rendered "Sep 7" for the same instant, which is a hydration mismatch on every
 * assignment row: 40 logged React errors (#418, #419, #422, #425) against six students on
 * /student/assignments before this was pinned.
 *
 * A deadline is a fact about the COURSE, not about where the reader is sitting, so "due Sep 7,
 * 11:59 pm" now reads the same in Michigan, in Madrid, and on the server. America/New_York
 * rather than a fixed -05:00: the stored dates already move from 03:59Z to 04:59Z after 1
 * November, which is the daylight-saving shift, and a frozen offset would be an hour out for
 * half the semester.
 */

/**
 * The academic time zone. Deadlines, calendars and timestamps are all rendered here so that
 * server and client always agree and every reader sees the same wall-clock time.
 */
export const COURSE_TIME_ZONE = 'America/New_York'


/** "Aug 10, 2026" / "10 ago 2026". */
export function formatDate(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: COURSE_TIME_ZONE })
}

/** "Aug 10" / "10 ago" — for tight spaces where the year is obvious from context. */
export function formatDateShort(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: COURSE_TIME_ZONE })
}

/** "Mon, Aug 10, 2026" / "lun, 10 ago 2026". */
export function formatDateLong(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleDateString(locale, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: COURSE_TIME_ZONE,
  })
}

/**
 * A date AND time, in the app's language.
 *
 * Deliberately just the locale, with no option set. A bare `toLocaleString()` follows the
 * BROWSER, so a Spanish page on an English browser printed English timestamps; passing the
 * locale is the whole fix. Adding options would be a second change — and the one option
 * combination this app tried before (dateStyle with timeZoneName) is exactly the one Safari
 * rejected and Chrome accepted, which is why these helpers stay plain.
 */
export function formatDateTime(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleString(locale, { timeZone: COURSE_TIME_ZONE })
}

/**
 * A number with the reader's own grouping. Spanish writes 1.234 where English writes 1,234, so
 * a bare toLocaleString() — which follows the BROWSER, not the app — puts English separators in
 * a Spanish page whenever the two disagree.
 */
export function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale)
}
