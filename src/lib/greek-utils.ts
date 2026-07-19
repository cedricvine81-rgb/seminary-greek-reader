/** Strip accents/breathing marks so Greek comparisons work without diacriticals. */
export function normalizeGreek(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Like normalizeGreek but KEEPS the breathing marks (U+0313 smooth, U+0314 rough),
 * stripping only accents, diaeresis, and iota subscript. Needed to tell apart minimal
 * pairs that differ only in breathing — e.g. εἷς "one" (rough) vs εἰς "into" (smooth),
 * which normalizeGreek collapses to the same "εις".
 */
export function foldGreekKeepBreathing(str: string): string {
  return str.normalize('NFD').replace(/[̀-̒̕-ͯ]/g, '').toLowerCase().normalize('NFC')
}
