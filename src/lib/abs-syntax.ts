// ABS NT Syntax Database — phrase/clause level syntax
// Source: Asian Bible Society NT Syntax Database
// Loaded lazily from /data/abs-syntax.json

export interface AbsSyntaxEntry {
  clause?: string      // clause type: 'declarative' | 'interrogative' | 'imperative' | 'exclamatory'
  discourse?: string   // discourse level: 'mainline' | 'background' | 'offline'
  phrase?: string      // phrase type: 'NP' | 'VP' | 'PP' | 'AdjP' | 'AdvP'
  function?: string    // function: 'subject' | 'predicate' | 'object' | 'modifier' | 'complement' | 'adjunct'
  information?: string // information structure: 'topic' | 'focus' | 'given' | 'new'
}

export interface AbsDisplay {
  clause: string | null
  discourse: string | null
  phrase: string | null
  function: string | null
  information: string | null
}

// ── Lazy-loaded cache ─────────────────────────────────────────────────────────

let _cache: Record<string, AbsSyntaxEntry> | null = null
let _loading: Promise<Record<string, AbsSyntaxEntry>> | null = null

export function loadAbsSyntax(): Promise<Record<string, AbsSyntaxEntry>> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = fetch('/data/abs-syntax.json')
    .then(r => r.json() as Promise<Record<string, AbsSyntaxEntry>>)
    .then(data => { _cache = data; return data })
    .catch(() => { _cache = {}; return {} as Record<string, AbsSyntaxEntry> })
  return _loading
}

// ── Human-readable label maps ─────────────────────────────────────────────────

const CLAUSE_LABELS: Record<string, string> = {
  declarative:   'Declarative',
  interrogative: 'Interrogative',
  imperative:    'Imperative',
  exclamatory:   'Exclamatory',
}

const DISCOURSE_LABELS: Record<string, string> = {
  mainline:   'Mainline',
  background: 'Background',
  offline:    'Offline',
}

const PHRASE_LABELS: Record<string, string> = {
  NP:   'Noun Phrase (NP)',
  VP:   'Verb Phrase (VP)',
  PP:   'Prepositional Phrase (PP)',
  AdjP: 'Adjective Phrase (AdjP)',
  AdvP: 'Adverb Phrase (AdvP)',
}

const FUNCTION_LABELS: Record<string, string> = {
  subject:     'Subject',
  predicate:   'Predicate',
  object:      'Object',
  modifier:    'Modifier',
  complement:  'Complement',
  adjunct:     'Adjunct',
}

const INFORMATION_LABELS: Record<string, string> = {
  topic: 'Topic',
  focus: 'Focus',
  given: 'Given',
  new:   'New',
}

// ── Display builder ───────────────────────────────────────────────────────────

export function buildAbsDisplay(entry: AbsSyntaxEntry | undefined | null): AbsDisplay | null {
  if (!entry) return null

  const clause      = entry.clause      ? (CLAUSE_LABELS[entry.clause]           ?? entry.clause)      : null
  const discourse   = entry.discourse   ? (DISCOURSE_LABELS[entry.discourse]     ?? entry.discourse)   : null
  const phrase      = entry.phrase      ? (PHRASE_LABELS[entry.phrase]           ?? entry.phrase)      : null
  const fn          = entry.function    ? (FUNCTION_LABELS[entry.function]       ?? entry.function)    : null
  const information = entry.information ? (INFORMATION_LABELS[entry.information] ?? entry.information) : null

  if (!clause && !discourse && !phrase && !fn && !information) return null

  return { clause, discourse, phrase, function: fn, information }
}
