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
