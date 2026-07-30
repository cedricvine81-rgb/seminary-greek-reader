// Construct search: the query shape, plus a compact URL encoding so a construct is a
// shareable link (an instructor can hand students a search, or hang an assignment off one).
// Imported by both the client builder and the server engine — keep it dependency-free.

export interface ConstructTerm {
  // Selected features grouped by parsing category. Within a category the alternatives are
  // OR'd (Case = Genitive OR Dative); across categories they are AND'd. A category the user
  // left as "any" simply isn't present. Values are the lowercased parsing tokens from
  // morph-features.ts, matching the index's parsing strings.
  features: Record<string, string[]>
  // Optional lexeme restriction — any inflected form of this lemma (normalized server-side).
  lemma?: string
  // Strong's numbers standing for that lexeme, when the corpus has no real lemmas to match on.
  // The LXX chapter files store the surface form in their `lemma` field, so matching the string
  // would only ever find one spelling; its numbers group the inflected forms properly. Set from
  // the lemma table, so `lemma` stays what the user typed and this is how it's actually matched.
  strongs?: string[]
}

// Which Greek text to search. One at a time: results render through GreekSearchResults, which
// fetches word data for a single corpus, and mixing the two would mean changing a component the
// other search paths share.
export type ConstructCorpus = 'GNT' | 'LXX'

export interface ConstructQuery {
  corpus: ConstructCorpus
  terms: ConstructTerm[]
  // Maximum distance between the matched words, in words. Adjacent words are 1 apart.
  within: number
  // All matched words must fall inside a window of `within` words either way; true additionally
  // requires them to appear in the order given (so ordered results are a subset of unordered).
  ordered: boolean
  // Confine a match to a single verse (off by default, so a construct can straddle a
  // verse boundary — the flat index is built per book precisely to allow that).
  sameVerse: boolean
  // Optional osisId scope.
  books?: string[]
}

// public/data/lemma-forms.json (scripts/build-construct-index.mjs): what each lemma is actually
// attested as in the corpus. `p` is its parts of speech, commonest first. Every other key is a
// parsing category holding only the values that NARROW it — a category is absent when the lemma
// covers all of them (or the part of speech doesn't use it), meaning "no restriction". A category
// left with a single value isn't a choice at all: λόγος is masculine and that's that.
export interface LemmaForms {
  p: string[]
  [category: string]: string[]
}

export const CONSTRUCT_DEFAULT_WITHIN = 4
export const CONSTRUCT_MAX_WITHIN = 30
export const CONSTRUCT_MAX_TERMS = 3

export function emptyTerm(): ConstructTerm {
  return { features: {} }
}

export function defaultQuery(): ConstructQuery {
  return { corpus: 'GNT', terms: [emptyTerm(), emptyTerm()], within: CONSTRUCT_DEFAULT_WITHIN, ordered: false, sameVerse: false }
}

// A term is only usable once it constrains something.
export function termIsEmpty(t: ConstructTerm): boolean {
  return !t.lemma && !t.strongs?.length && Object.values(t.features).every(v => v.length === 0)
}

// Flat list of the parsing tokens a term requires, for display.
export function termFeatureList(t: ConstructTerm): string[] {
  return Object.values(t.features).flat()
}

// ─── URL encoding ─────────────────────────────────────────────────────────────
// c=<term>~<term>   term = <category group>:<group>…  group = alt|alt   lemma = @<lemma>
// e.g.  c=pos.verb:tense.aorist:mood.participle~pos.noun:case.genitive|dative@πνευμα
// Categories are named so decoding can rebuild the OR groups (and so a link stays readable).

function encodeTerm(t: ConstructTerm): string {
  const groups = Object.entries(t.features)
    .filter(([, vals]) => vals.length > 0)
    .map(([cat, vals]) => `${cat}.${vals.join('|')}`)
  return groups.join(':')
    + (t.lemma ? `@${t.lemma}` : '')
    + (t.strongs?.length ? `#${t.strongs.join('.')}` : '')
}

function decodeTerm(s: string): ConstructTerm {
  // Strong's numbers come after the lemma, as '#1234.5678'.
  const hash = s.indexOf('#')
  const strongs = hash >= 0 ? s.slice(hash + 1).split('.').map(x => x.trim()).filter(Boolean) : []
  s = hash >= 0 ? s.slice(0, hash) : s
  const at = s.indexOf('@')
  const lemma = at >= 0 ? s.slice(at + 1).trim() : ''
  const body = at >= 0 ? s.slice(0, at) : s
  const features: Record<string, string[]> = {}
  for (const group of body.split(':')) {
    const dot = group.indexOf('.')
    if (dot <= 0) continue
    const cat = group.slice(0, dot)
    const vals = group.slice(dot + 1).split('|').map(v => v.trim()).filter(Boolean)
    if (vals.length) features[cat] = vals
  }
  const term: ConstructTerm = { features }
  if (lemma) term.lemma = lemma
  if (strongs.length) term.strongs = strongs
  return term
}

export function encodeConstruct(q: ConstructQuery): URLSearchParams {
  const p = new URLSearchParams()
  if (q.corpus !== 'GNT') p.set('in', q.corpus)
  p.set('c', q.terms.map(encodeTerm).join('~'))
  p.set('w', String(q.within))
  if (q.ordered) p.set('ord', '1')
  if (q.sameVerse) p.set('sv', '1')
  if (q.books?.length) p.set('books', q.books.join(','))
  return p
}

type RawParams = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? '' : v ?? '')

export function decodeConstruct(params: RawParams): ConstructQuery {
  const c = one(params.c)
  const terms = c ? c.split('~').map(decodeTerm) : []
  const w = Number(one(params.w))
  const books = one(params.books).split(',').map(s => s.trim()).filter(Boolean)
  return {
    corpus: one(params.in) === 'LXX' ? 'LXX' : 'GNT',
    // Always present the builder with at least two term cards.
    terms: terms.length >= 2 ? terms.slice(0, CONSTRUCT_MAX_TERMS) : [...terms, emptyTerm(), emptyTerm()].slice(0, 2),
    within: Number.isFinite(w) && w >= 1 ? Math.min(w, CONSTRUCT_MAX_WITHIN) : CONSTRUCT_DEFAULT_WITHIN,
    ordered: one(params.ord) === '1',
    sameVerse: one(params.sv) === '1',
    ...(books.length ? { books } : {}),
  }
}

// Is this query runnable? Needs at least two constrained terms.
export function queryIsRunnable(q: ConstructQuery): boolean {
  const filled = q.terms.filter(t => !termIsEmpty(t))
  return filled.length >= 2
}
