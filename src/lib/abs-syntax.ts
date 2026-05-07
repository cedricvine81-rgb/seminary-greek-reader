// ABS NT Syntax — Asian Bible Society Nestle 1904 syntax trees
// Source: biblicalhumanities/greek-new-testament (CC-BY-SA)
// Loaded lazily from /data/abs-syntax.json

export interface AbsSyntaxEntry {
  phrase?:     string   // 'NP' | 'VP' | 'PP' | 'AdjP' | 'AdvP'
  rule?:       string   // phrase construction rule, e.g. 'N2NP', 'DetNP', 'NPofNP'
  function?:   string   // 'S' | 'O' | 'O2' | 'IO' | 'V' | 'P' | 'ADV' | 'VC'
  clauseRule?: string   // rule of the enclosing clause, e.g. 'S-V-O', 'S-V'
}

export interface AbsDisplay {
  phrase:      string | null
  function:    string | null
  rule:        string | null
  clauseRule:  string | null
}

// ── Lazy-loaded cache ─────────────────────────────────────────────────────────

let _cache: Record<string, AbsSyntaxEntry> | null = null
let _loading: Promise<Record<string, AbsSyntaxEntry>> | null = null

export function loadAbsSyntax(): Promise<Record<string, AbsSyntaxEntry>> {
  if (_cache)   return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = fetch('/data/abs-syntax.json')
    .then(r => r.json() as Promise<Record<string, AbsSyntaxEntry>>)
    .then(data => { _cache = data; return data })
    .catch(() => { _cache = {}; return {} as Record<string, AbsSyntaxEntry> })
  return _loading
}

// ── Label maps ────────────────────────────────────────────────────────────────

const PHRASE_LABELS: Record<string, string> = {
  NP:   'Noun Phrase',
  VP:   'Verb Phrase',
  PP:   'Prepositional Phrase',
  AdjP: 'Adjective Phrase',
  AdvP: 'Adverb Phrase',
}

const FUNCTION_LABELS: Record<string, string> = {
  S:   'Subject',
  O:   'Direct Object',
  O2:  'Second Object',
  IO:  'Indirect Object',
  V:   'Verbal Predicate',
  P:   'Nominal Predicate',
  ADV: 'Adverbial',
  VC:  'Verbal Complement',
}

const RULE_LABELS: Record<string, string> = {
  N2NP:       'Noun → NP',
  NPofNP:     'NP of NP (Genitive)',
  DetNP:      'Articular NP',
  AdjNP:      'Adjective + NP',
  'Np-Appos': 'Appositive NP',
  Np2S:       'NP as Subject',
  Np2O:       'NP as Object',
  Np2P:       'NP as Predicate',
  Np2Adv:     'NP as Adverbial',
  Np2IO:      'NP as Indirect Object',
  V2VP:       'Verb → VP',
  Vp2V:       'VP → Verbal',
  'S-V':      'Subject · Verb',
  'S-V-O':    'Subject · Verb · Object',
  'S-V-C':    'Subject · Verb · Complement',
  'S-V-O-C':  'Subject · Verb · Object · Complement',
  'S-V-O2':   'Subject · Verb · Object₂',
  'V-IO-O':   'Verb · Indirect Obj · Object',
  P2CL:       'Predicate Clause',
  Conj2CL:    'Conjoined Clauses',
  Conj13CL:   'Conjoined Clauses',
}

// ── Display builder ───────────────────────────────────────────────────────────

export function buildAbsDisplay(entry: AbsSyntaxEntry | undefined | null): AbsDisplay | null {
  if (!entry) return null

  const phrase     = entry.phrase     ? (PHRASE_LABELS[entry.phrase]        ?? entry.phrase)     : null
  const func       = entry.function   ? (FUNCTION_LABELS[entry.function]    ?? entry.function)   : null
  const rule       = entry.rule       ? (RULE_LABELS[entry.rule]            ?? entry.rule)       : null
  const clauseRule = entry.clauseRule ? (RULE_LABELS[entry.clauseRule]      ?? entry.clauseRule) : null

  if (!phrase && !func && !rule && !clauseRule) return null

  return { phrase, function: func, rule, clauseRule }
}
