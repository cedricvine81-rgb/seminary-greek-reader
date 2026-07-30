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
  // Require this word to AGREE with another (by its index in `terms`) in the given categories —
  // 'case', 'number', 'gender'. This is what expresses adjectival concord, and with it the
  // queries that actually matter for teaching: attributive vs predicate position, Granville
  // Sharp. Both words must carry a value in the category and the values must be equal.
  agreeWith?: number
  agreeOn?: string[]
  // Invert the term: the construct matches only where NO such word appears between the others.
  // "An article, then a noun, with no intervening article" — the Colwell/Sharp shape.
  negate?: boolean
}

// Which Greek text to search — one at a time. The biblical corpora render through
// GreekSearchResults (per-verse word data from /api/reader); the prose corpora have their own
// view, since /api/reader doesn't serve them.
//
// `tagging` is the honest part: the New Testament and Septuagint are hand-tagged, the prose corpora
// are Stanza output at roughly 90-95%. A hit in prose is evidence, not proof, and the UI says so —
// this is a teaching tool, and a student shouldn't cite a mistagged aorist on our authority.
// `readerAligned` says whether the index's word positions line up with the text results are rendered
// against, which is what lets a hit mark exactly the matched words. All of them do. The Septuagint
// and prose indexes are built from the very files their readers display; the New Testament's comes
// from the parsing trees, which ARE Nestle 1904 — verified word for word across 6,349 verses, zero
// differences — so construct results render against NA1904 rather than the reader's default
// edition, and align by construction.
export const CONSTRUCT_CORPORA = [
  { id: 'GNT', label: 'Greek New Testament', kind: 'bible', tagging: 'gold', readerAligned: true },
  { id: 'LXX', label: 'Greek Old Testament (Septuagint)', kind: 'bible', tagging: 'gold', readerAligned: true },
  { id: 'josephus', label: 'Josephus', kind: 'prose', tagging: 'machine', readerAligned: true },
  { id: 'philo', label: 'Philo', kind: 'prose', tagging: 'machine', readerAligned: true },
  { id: 'apostolic-fathers', label: 'Apostolic Fathers', kind: 'prose', tagging: 'machine', readerAligned: true },
  { id: 'pseudepigrapha', label: 'Pseudepigrapha', kind: 'prose', tagging: 'machine', readerAligned: true },
  { id: 'eusebius', label: 'Eusebius', kind: 'prose', tagging: 'machine', readerAligned: true },
  { id: 'justin', label: 'Justin Martyr', kind: 'prose', tagging: 'machine', readerAligned: true },
  { id: 'greco', label: 'Greco-Roman', kind: 'prose', tagging: 'machine', readerAligned: true },
] as const

// 'ALL' searches every corpus and reports a distribution (see searchConstructAll). Deliberately
// NOT a member of CONSTRUCT_CORPORA — that list is what the engine iterates and what has index
// files, and folding a pseudo-corpus into it would mean guarding every loop.
export const CONSTRUCT_ALL = 'ALL'
export type ConstructCorpus = typeof CONSTRUCT_CORPORA[number]['id'] | 'ALL'

export function corpusInfo(id: string) {
  return CONSTRUCT_CORPORA.find(c => c.id === id) ?? CONSTRUCT_CORPORA[0]
}
export function isProseCorpus(id: string): boolean {
  return id !== CONSTRUCT_ALL && corpusInfo(id).kind === 'prose'
}

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
    + (t.agreeWith !== undefined && t.agreeOn?.length ? `=${t.agreeWith}.${t.agreeOn.join('|')}` : '')
    + (t.negate ? '!' : '')
}

function decodeTerm(s: string): ConstructTerm {
  // Trailing '!' negates the term.
  const negate = s.endsWith('!')
  if (negate) s = s.slice(0, -1)
  // Agreement comes last, as '=<termIndex>.<category>|<category>'.
  const eq = s.indexOf('=')
  let agreeWith: number | undefined
  let agreeOn: string[] = []
  if (eq >= 0) {
    const spec = s.slice(eq + 1)
    s = s.slice(0, eq)
    const dot = spec.indexOf('.')
    const idx = Number(dot >= 0 ? spec.slice(0, dot) : spec)
    if (Number.isInteger(idx) && idx >= 0) {
      agreeWith = idx
      agreeOn = (dot >= 0 ? spec.slice(dot + 1) : '').split('|').map(x => x.trim()).filter(Boolean)
    }
  }
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
  if (agreeWith !== undefined && agreeOn.length) { term.agreeWith = agreeWith; term.agreeOn = agreeOn }
  if (negate) term.negate = true
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
    // Only a corpus we actually index; anything else falls back rather than reading a missing file.
    corpus: (one(params.in) === CONSTRUCT_ALL
      ? CONSTRUCT_ALL
      : CONSTRUCT_CORPORA.find(c => c.id === one(params.in))?.id ?? 'GNT') as ConstructCorpus,
    // Always present the builder with at least two term cards.
    terms: terms.length >= 2 ? terms.slice(0, CONSTRUCT_MAX_TERMS) : [...terms, emptyTerm(), emptyTerm()].slice(0, 2),
    within: Number.isFinite(w) && w >= 1 ? Math.min(w, CONSTRUCT_MAX_WITHIN) : CONSTRUCT_DEFAULT_WITHIN,
    ordered: one(params.ord) === '1',
    sameVerse: one(params.sv) === '1',
    ...(books.length ? { books } : {}),
  }
}

// The search API speaks `bookId`; the biblical results view keys hits by `osisId`. Kept here as one
// function used by both the single-corpus and cross-corpus paths, because getting it wrong renders
// a reference as a bare "2:1" with no book name — which is exactly what happened when the
// cross-corpus path did its own mapping and forgot the rename.
export interface ApiBiblicalHit {
  bookId: string
  chapter: number
  verse: number
  text: string
  matchedLemmas?: string[]
  matchedWords?: number[]
  crossesVerse?: boolean
}
export function toBiblicalHit(v: ApiBiblicalHit) {
  return {
    osisId: v.bookId,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text,
    matchedLemmas: v.matchedLemmas,
    matchedWords: v.matchedWords,
    crossesVerse: v.crossesVerse,
  }
}

// Runnable once ONE word is constrained — a single term is a legitimate search ("every hortatory
// subjunctive"), it just isn't a construct. A negated term says where a match may not be, so it
// can't define the search on its own.
export function queryIsRunnable(q: ConstructQuery): boolean {
  return q.terms.filter(t => !termIsEmpty(t) && !t.negate).length >= 1
}
