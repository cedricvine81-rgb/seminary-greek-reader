// Explicit-citation machinery — Allison's device 1 ("does the author name the source?").
//
// Two jobs, both about the words a NT author uses to FRAME a quotation rather than the
// words he quotes:
//
//   1. Keep them out of the allusion search. "καθὼς γέγραπται" is rare as a SEQUENCE, so
//      the rarity weighting scores it highly — and it then matches every "as it is written"
//      in the Septuagint (2 Kgdms 14:6, 2 Chr 23:16, Tob 1:4, 1 Esd 3:7 …), burying the
//      passage actually being quoted. Same for the prophet's name: Mark 1:2 naming Isaiah
//      is evidence about Mark, not a shared word with Isaiah 40.
//   2. Report them. Naming the source IS device 1, so if we can see the formula we can
//      answer that question for the student instead of leaving an empty checkbox.
//
// Strong's numbers below were read off the tagged GNT (public/data/phrase-tree), not from
// memory — a wrong number here would silently drop a real content word from the search.

/** Citation formulae: the "as it is written / the prophet says" furniture. */
export const CITATION_FORMULA: Record<string, string> = {
  '2531': 'καθώς',     // καθὼς γέγραπται
  '1125': 'γράφω',     // γέγραπται
  '4396': 'προφήτης',  // ἐν τῷ … προφήτῃ
}

/** Named sources: prophets and authors a citation formula points at. */
export const NAMED_SOURCE: Record<string, string> = {
  '2268': 'Isaiah',
  '3475': 'Moses',
  '1138': 'David',
  '2408': 'Jeremiah',
  '2493': 'Joel',
  '1158': 'Daniel',
}

/** LXX books a named source maps to, for "prioritise the named book". Deliberately loose:
 *  Moses → the Pentateuch, David → the Psalter. */
export const SOURCE_BOOKS: Record<string, string[]> = {
  Isaiah:   ['Isa'],
  Moses:    ['Gen', 'Exod', 'Lev', 'Num', 'Deut'],
  David:    ['Ps'],
  Jeremiah: ['Jer', 'Lam'],
  Joel:     ['Joel'],
  Daniel:   ['Dan'],
}

/** Auto-suggest skips these: they clear the rarity bar but are framing, not shared content.
 *  Only the SUGGESTION is filtered — a student can still select any of them by hand. */
export const CITATION_STOP = new Set([
  ...Object.keys(CITATION_FORMULA),
  ...Object.keys(NAMED_SOURCE),
])

export interface CitationSignal {
  /** A citation formula is present (γέγραπται and friends). */
  formula: boolean
  /** Formula words actually seen, for the checklist note. */
  formulaWords: string[]
  /** Sources named in the passage, e.g. ["Isaiah"]. */
  sources: string[]
  /** LXX book ids those sources point at. */
  books: string[]
}

/**
 * Look for an explicit citation in a passage's tokens (reading order not required).
 * γράφω alone counts — γέγραπται is the formula almost wherever it appears in the NT —
 * but a named prophet without it counts only as a named source, not a formula.
 */
export function detectCitation(tokens: { strongs?: string }[]): CitationSignal {
  const seen = new Set(tokens.map(t => t.strongs).filter((s): s is string => !!s))
  const formulaWords = Object.entries(CITATION_FORMULA)
    .filter(([s]) => seen.has(s))
    .map(([, w]) => w)
  const sources = Object.entries(NAMED_SOURCE)
    .filter(([s]) => seen.has(s))
    .map(([, name]) => name)
  return {
    formula: seen.has('1125'),          // γράφω — the load-bearing one
    formulaWords,
    sources,
    books: sources.flatMap(s => SOURCE_BOOKS[s] ?? []),
  }
}
