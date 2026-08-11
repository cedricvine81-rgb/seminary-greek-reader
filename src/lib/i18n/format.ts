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
 */

/** "Aug 10, 2026" / "10 ago 2026". */
export function formatDate(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** "Aug 10" / "10 ago" — for tight spaces where the year is obvious from context. */
export function formatDateShort(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/** "Mon, Aug 10, 2026" / "lun, 10 ago 2026". */
export function formatDateLong(value: string | number | Date, locale: string): string {
  return new Date(value).toLocaleDateString(locale, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}
