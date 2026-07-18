// Macula Hebrew (WLC) syntax — Clear Bible syntax trees over OSHB morphology (CC BY 4.0),
// imported by scripts/import-macula-hebrew-syntax.py into public/data/macula-hebrew/<osisId>.json
// (keyed by "chapter.verse.word"). The Hebrew counterpart to the Greek Macula syntax; loaded
// lazily per book the first time a Hebrew word menu wants it.

export interface MaculaHebrewEntry {
  role?: string         // the word's role in its phrase: s, o, o2, v, p, adv, pp
  phraseClass?: string  // its phrase type: np, vp, pp, adjp, advp, relp, nump, cjp, ijp
  clauseRule?: string   // the enclosing clause's constituent order, e.g. "V-S-O", "P2CL"
}

type Book = Record<string, MaculaHebrewEntry>
const _cache = new Map<string, Book | null>()
const _loading = new Map<string, Promise<Book>>()

/** Load (and cache) one book's Macula Hebrew syntax. Returns {} if unavailable. */
export function loadMaculaHebrew(osisId: string): Promise<Book> {
  const hit = _cache.get(osisId)
  if (hit) return Promise.resolve(hit)
  const pending = _loading.get(osisId)
  if (pending) return pending
  const p = fetch(`/data/macula-hebrew/${osisId}.json`)
    .then(r => (r.ok ? r.json() : {}) as Promise<Book>)
    .then(d => { _cache.set(osisId, d); return d })
    .catch(() => { _cache.set(osisId, {}); return {} as Book })
  _loading.set(osisId, p)
  return p
}

/** Look up a word by its reader id ("Gen.1.1.3") against an already-loaded book. */
export function lookupMaculaHebrew(book: Book | null, wordId: string): MaculaHebrewEntry | null {
  if (!book) return null
  const parts = wordId.split('.')            // "Gen.1.1.3" → key "1.1.3"
  return book[parts.slice(1).join('.')] ?? null
}

// ── Human-readable labels ──────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  s: 'Subject', o: 'Object', o2: 'Second object', v: 'Verb',
  p: 'Predicate', adv: 'Adverbial', pp: 'Prepositional phrase',
}
const PHRASE_LABELS: Record<string, string> = {
  np: 'Noun phrase', vp: 'Verb phrase', pp: 'Prepositional phrase',
  adjp: 'Adjective phrase', advp: 'Adverb phrase', relp: 'Relative phrase',
  nump: 'Numeral phrase', cjp: 'Conjunction phrase', ijp: 'Interjection',
}
// Elements in a hyphenated clause rule like "V-S-O" or "V-PP-O".
const CLAUSE_ELEMENT: Record<string, string> = {
  S: 'Subject', V: 'Verb', O: 'Object', O2: 'Object₂', P: 'Predicate',
  PP: 'Prep. phrase', ADV: 'Adverbial', IO: 'Indirect object', Cj: 'Conjunction', Np: 'Noun',
}
// Whole-rule labels for clause-type rules that don't decompose by hyphen (X2CL = "X clause").
const CLAUSE_OVERRIDES: Record<string, string> = {
  V2CL: 'Verbal clause', P2CL: 'Verbless (predicate) clause', S2CL: 'Subject clause',
  O2CL: 'Object clause', Np2CL: 'Nominal clause', ADV2CL: 'Adverbial clause',
  CLaCL: 'Clause', VCL: 'Verbal clause',
}

export function maculaRole(entry: MaculaHebrewEntry): string | null {
  if (!entry.role) return null
  const r = ROLE_LABELS[entry.role] ?? entry.role
  const cls = entry.phraseClass && PHRASE_LABELS[entry.phraseClass]
  // Avoid "Prepositional phrase · Prepositional phrase".
  return cls && cls !== r ? `${r} · ${cls.toLowerCase()}` : r
}

export function maculaClause(entry: MaculaHebrewEntry): string | null {
  const rule = entry.clauseRule
  if (!rule) return null
  if (CLAUSE_OVERRIDES[rule]) return CLAUSE_OVERRIDES[rule]
  return rule.split('-').map(tok => CLAUSE_ELEMENT[tok] ?? tok).join(' – ')
}
