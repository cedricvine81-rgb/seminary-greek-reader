// Client-side loader + cache for the Hebrew/Aramaic Strong's lexicon
// (public/data/hebrew-lexicon.json, built by scripts/build-hebrew-lexicon.py). Fetched once as
// a static asset the first time the Reader shows the Hebrew corpus, then looked up synchronously
// when a word is hovered/clicked.

export interface HebrewLexEntry {
  lemma: string
  xlit: string
  gloss: string   // short sense (quick parsing pane)
  def: string     // Strong's concise definition
  bdb?: string    // Brown-Driver-Briggs entry (the fuller scholarly definition, in the word menu)
}

export type HebrewLexicon = Record<string, HebrewLexEntry>

let _cache: HebrewLexicon | null = null
let _loading: Promise<HebrewLexicon> | null = null

export function loadHebrewLexicon(): Promise<HebrewLexicon> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = fetch('/data/hebrew-lexicon.json')
    .then(r => r.json())
    .then((d: HebrewLexicon) => { _cache = d; return d })
    .catch(() => ({}))
  return _loading
}

/** Synchronous lookup against the already-loaded lexicon (null before it has loaded). */
export function lookupHebrewStrongs(lex: HebrewLexicon | null, strongs: string | undefined): HebrewLexEntry | null {
  if (!lex || !strongs) return null
  // Strip a leading "H" and any letter suffix ("430a" → "430") the source occasionally carries.
  const key = strongs.replace(/^H/, '').replace(/[a-z]$/i, '')
  return lex[key] ?? lex[strongs] ?? null
}
