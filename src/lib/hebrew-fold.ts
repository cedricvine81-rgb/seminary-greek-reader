// Fold a Hebrew string for searching/matching: strip the vowel points and cantillation
// (leaving the consonantal skeleton, which matches the same written form regardless of the
// contextual pointing), normalise word-final letters to their medial forms, and treat the
// maqqef as a word break. Client-safe (no node imports) — the server search index
// (src/lib/search.ts) and the search-results highlighter both fold with THIS function, so
// what the server matched is exactly what the client marks.
const HEB_FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }
export function normalizeHebrew(s: string): string {
  return s
    .replace(/־/g, ' ')                          // maqqef -> space
    .replace(/[֑-ׇ]/g, '')                  // strip vowel points + cantillation -> consonants
    .replace(/[ךםןףץ]/g, ch => HEB_FINALS[ch])  // final -> medial letters
    .replace(/\s+/g, ' ')
    .trim()
}
