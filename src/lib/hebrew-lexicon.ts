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

// 147 Strong's entries have a gloss of just "properly" — the opening adverb of the concise
// definition, which the gloss field was cut from ("properly, a mumble, i.e. a water skin").
// A reader shown "בִּקְעָה — properly" learns nothing, so a degenerate gloss falls back to the
// substantive part of the definition. Same repair the parsing pool needed.
const DEGENERATE = /^(properly|a primitive root|the same as|of uncertain derivation|denominative)\b/i

export function usableGloss(entry: HebrewLexEntry | null): string {
  if (!entry) return ''
  const g = (entry.gloss || '').trim()
  if (g && !DEGENERATE.test(g)) return g
  const def = (entry.def || '').trim()
  if (!def) return g
  // Take the clause that carries the sense: after "properly," or after "i.e."
  const m = def.match(/\bi\.e\.\s*(.+)$/i) ?? def.match(/^properly,\s*(.+)$/i)
  const out = (m ? m[1] : def).replace(/\s*\([^)]*\)\s*$/, '').trim()
  return out.length > 90 ? out.slice(0, 88).replace(/[\s,;].?$/, '') + '…' : out
}

/** Synchronous lookup against the already-loaded lexicon (null before it has loaded). */
export function lookupHebrewStrongs(lex: HebrewLexicon | null, strongs: string | undefined): HebrewLexEntry | null {
  if (!lex || !strongs) return null
  // Strip a leading "H" and any letter suffix ("430a" → "430") the source occasionally carries.
  const key = strongs.replace(/^H/, '').replace(/[a-z]$/i, '')
  return lex[key] ?? lex[strongs] ?? null
}

// ── Retrofit for token-based panes ────────────────────────────────────────────────────
// The Reader's Hebrew words flow through buildHebrewInfo (HebrewWord.tsx), which stamps
// `script: 'hebrew'` so the ParsingPanel uses the Hebrew lexicon. The token-based views
// (Synopsis, Phrasing, Allusions, Rhetoric) built bare payloads with a NAKED Strong's
// number — and the panel, seeing no script, prefixed it with G and looked it up in the
// GREEK lexicon: הֵמָּה (H1992 "they") came back as Thayer's on G1992, "an epistle."
// Route every such payload through this before it reaches the pane.
import { hasHebrew } from '@/lib/script-detect'
import type { LexicalInfoPanel } from '@/types/lexicon'

export function hebrewizeInfo(info: LexicalInfoPanel, lex: HebrewLexicon | null): LexicalInfoPanel {
  if (info.script || !hasHebrew(info.surface)) return info   // Greek/LXX panes stay Greek
  const bare = info.strongs?.replace(/^H/, '')
  const entry = lookupHebrewStrongs(lex, bare)
  return {
    ...info,
    script: 'hebrew',
    lexeme: entry?.lemma || info.lexeme || info.surface,
    gloss: usableGloss(entry) || info.gloss,
    strongs: bare ? `H${bare}` : info.strongs,
    transliteration: entry?.xlit || undefined,
    definition: entry?.def || undefined,
    bdbDefinition: entry?.bdb || undefined,
  }
}
