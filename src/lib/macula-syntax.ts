// Macula Greek NT Syntax — Clear Bible Nestle 1904 lowfat XML
// Source: Clear-Bible/macula-greek (CC-BY-SA)
// Loaded lazily from /data/macula-syntax.json

export interface MaculaEntry {
  role?:        string  // phrase role: s, o, v, p, io, o2, adv, vc, aux
  phraseClass?: string  // phrase class: np, vp, pp, adjp, advp
  clauseRule?:  string  // enclosing clause rule: S-V-O, P2CL, S-V, etc.
  clauseRole?:  string  // how the enclosing clause itself functions: s, o, adv, p
}

// ── Lazy-loaded cache ─────────────────────────────────────────────────────────

let _cache: Record<string, MaculaEntry> | null = null
let _loading: Promise<Record<string, MaculaEntry>> | null = null

export function loadMaculaSyntax(): Promise<Record<string, MaculaEntry>> {
  if (_cache)   return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = fetch('/data/macula-syntax.json')
    .then(r => r.json() as Promise<Record<string, MaculaEntry>>)
    .then(data => { _cache = data; return data })
    .catch(() => { _cache = {}; return {} as Record<string, MaculaEntry> })
  return _loading
}

// ── Human-readable label maps ─────────────────────────────────────────────────

export const MACULA_ROLE_LABELS: Record<string, string> = {
  s:   'Subject',
  o:   'Direct Object',
  o2:  'Second Object',
  io:  'Indirect Object',
  v:   'Verbal Predicate',
  p:   'Nominal Predicate',
  adv: 'Adverbial',
  vc:  'Verbal Complement',
  aux: 'Auxiliary',
}

// Clause element abbreviations used in Macula rule strings like "S-V-O"
const CLAUSE_ELEMENT_LABELS: Record<string, string> = {
  S:   'Subject',
  V:   'Verb',
  O:   'Object',
  O2:  'Object₂',
  P:   'Predicate',
  ADV: 'Adverbial',
  IO:  'Indirect Object',
  VC:  'Copula',
}

// Special whole-rule labels that don't decompose by hyphen
const CLAUSE_RULE_OVERRIDES: Record<string, string> = {
  'P2CL':    'Verbless Predicate Clause',
  'V2CL':    'Verbal Clause',
  'S2CL':    'Subject Clause',
  'O2CL':    'Object Clause',
  'ADV2CL':  'Adverbial Clause',
  'IO2CL':   'Indirect Object Clause',
  'ClCl':    'Conjoined Clauses',
  'ClCl2':   'Conjoined Clauses',
  'PtclCL':  'Participle Clause',
  'Conj-CL': 'Conjoined Clause',
}

export function formatMaculaClauseRule(rule: string | null | undefined): string | null {
  if (!rule || rule.startsWith('err')) return null
  if (CLAUSE_RULE_OVERRIDES[rule]) return CLAUSE_RULE_OVERRIDES[rule]
  // Expand hyphen-separated elements: "S-V-O" → "Subject · Verb · Object"
  const parts = rule.split('-')
  const expanded = parts.map(p => CLAUSE_ELEMENT_LABELS[p] ?? p)
  return expanded.join(' · ')
}

export const MACULA_CLAUSE_ROLE_LABELS: Record<string, string> = {
  s:     'Subject clause',
  o:     'Object clause (indirect statement)',
  p:     'Predicate clause',
  adv:   'Adverbial clause',
  io:    'Indirect object clause',
  vc:    'Verbal complement clause',
  o2:    'Second object clause',
  topic: 'Topic clause',
}

export function getMaculaClauseRoleLabel(role: string | null | undefined): string | null {
  if (!role || role.startsWith('err') || role === 'ellipsis' || role === 'tail' || role === 'aux') return null
  return MACULA_CLAUSE_ROLE_LABELS[role] ?? null
}
