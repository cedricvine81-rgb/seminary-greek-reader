// Shared phrase/boolean parsing for the substring-based search engines (translations +
// background texts) and the Master Search highlighter. Rules:
//   • "quoted text"  → an exact phrase (internal spaces kept, matched contiguously)
//   • bare words     → individual terms; a verse must contain them ALL (AND, any order)
// Single-word queries behave exactly as before. Greek word/lemma search is unaffected.

// Lowercase + strip combining diacritics (identical to the engines' own normalize()).
export function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Trim quotes/punctuation that cling to the edges of a typed term (so "love." → "love").
const EDGE = /^[\s"'.,;:!?()[\]{}«»·—–]+|[\s"'.,;:!?()[\]{}«»·—–]+$/g

/** Parse a raw query into normalized AND-terms (quoted spans stay as one phrase term). */
export function parseSearchTerms(query: string): string[] {
  const out: string[] = []
  const re = /"([^"]+)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(query)) !== null) {
    const raw = m[1] ?? m[2] ?? ''
    const n = normalizeSearch(raw).replace(/\s+/g, ' ').replace(EDGE, '').trim()
    if (n) out.push(n)
  }
  return out
}

/** True when the already-normalized text contains every term (AND). Empty terms → no match. */
export function textMatchesTerms(normalizedText: string, terms: string[]): boolean {
  if (terms.length === 0) return false
  for (const t of terms) if (!normalizedText.includes(t)) return false
  return true
}

// Latin (incl. accented), digit, or Greek letter — used for whole-word detection in scoring.
const LETTER = /[a-z0-9À-ɏͰ-Ͽἀ-῿]/

/**
 * Relevance score for a verse (higher = more relevant), over already-normalized text + terms.
 * Rewards: more occurrences of each term, whole-word matches over substrings, and higher term
 * density (a short verse about the query beats a long one that merely mentions it). Used to
 * rank the flat biblical results; 0 means a term is absent (shouldn't happen post-AND-filter).
 */
export function scoreRelevance(normalizedText: string, terms: string[]): number {
  if (terms.length === 0) return 0
  let score = 0
  for (const t of terms) {
    if (!t) continue
    let idx = 0, occ = 0, whole = 0
    while ((idx = normalizedText.indexOf(t, idx)) !== -1) {
      occ++
      const before = idx > 0 ? normalizedText[idx - 1] : ''
      const after = normalizedText[idx + t.length] ?? ''
      if (!LETTER.test(before) && !LETTER.test(after)) whole++
      idx += t.length
    }
    if (occ === 0) return 0
    score += occ + whole * 2   // whole-word hits count for more than substrings
  }
  return score / Math.log2(Math.max(normalizedText.length, 1) + 8)   // density: favor focused verses
}
