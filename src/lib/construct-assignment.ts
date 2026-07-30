// Construct Search assignments: the instructor hands out a construct search as a link and
// the class goes and finds examples with it. The link IS the assignment — a construct is
// entirely described by its URL (construct-query.ts) — so it is stored in Assignment.reference
// and everything else here is about the find-list students fill in.

import {
  CONSTRUCT_ALL, corpusInfo, decodeConstruct, isProseCorpus, queryIsRunnable, termIsEmpty,
  type ConstructQuery, type ConstructTerm,
} from './construct-query'
import { FEATURE_LABEL } from './morph-features'

// Assignment.constructConfig
export interface ConstructConfig {
  requiredCount: number     // how many examples each student must find
  askTranslation: boolean   // include a "Your translation" column in the find-list
  askComment: boolean       // include a "Comment" column (why it's an instance, what it does)
}

export const DEFAULT_CONSTRUCT_CONFIG: ConstructConfig = {
  requiredCount: 10,
  askTranslation: true,
  askComment: true,
}

export const CONSTRUCT_MAX_FINDINGS = 50

/** Coerce a stored/posted config into a whole one, so a missing field never reaches the UI. */
export function normalizeConstructConfig(raw: unknown): ConstructConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_CONSTRUCT_CONFIG }
  const src = raw as Record<string, unknown>
  const n = Number(src.requiredCount)
  return {
    requiredCount: Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 1), CONSTRUCT_MAX_FINDINGS) : DEFAULT_CONSTRUCT_CONFIG.requiredCount,
    askTranslation: src.askTranslation === undefined ? DEFAULT_CONSTRUCT_CONFIG.askTranslation : Boolean(src.askTranslation),
    askComment: src.askComment === undefined ? DEFAULT_CONSTRUCT_CONFIG.askComment : Boolean(src.askComment),
  }
}

// One line of a student's find-list. Every field is optional in storage — a half-finished
// draft is the normal state until they submit.
export interface ConstructFinding {
  ref: string          // "Mark 1:9" — where they found it
  greek: string        // the words themselves
  translation: string  // their rendering (only asked for when config.askTranslation)
  comment: string      // their observation (only asked for when config.askComment)
}

export function emptyFinding(): ConstructFinding {
  return { ref: '', greek: '', translation: '', comment: '' }
}

/** A finding counts towards the required total once it says where AND what. */
export function findingIsComplete(f: ConstructFinding): boolean {
  return f.ref.trim().length > 0 && f.greek.trim().length > 0
}

/**
 * Coerce whatever is in the database (or arrived in a POST) into a clean find-list.
 * Trims, drops non-objects, and caps the length — the client sends the whole list on
 * every save, so this is the only guard on what gets stored.
 */
export function normalizeFindings(raw: unknown): ConstructFinding[] {
  if (!Array.isArray(raw)) return []
  const str = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 2000) : '')
  return raw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object' && !Array.isArray(f))
    .slice(0, CONSTRUCT_MAX_FINDINGS)
    .map(f => ({ ref: str(f.ref), greek: str(f.greek), translation: str(f.translation), comment: str(f.comment) }))
}

// ─── The search link ──────────────────────────────────────────────────────────

export interface ParsedConstructLink {
  /** Always a same-origin path, so a pasted absolute URL can't send students elsewhere. */
  href: string
  query: ConstructQuery
}

/**
 * Read what an instructor pasted into a construct link the app can serve.
 *
 * Accepts the whole URL copied from the search page's "Copy link" button, a bare
 * "/search/construct?…" path, or just the query string. Anything whose criteria don't
 * decode into a runnable search is rejected rather than saved — an assignment pointing at
 * an empty construct would send the class to a blank builder.
 */
export function parseConstructLink(input: string): ParsedConstructLink | null {
  const raw = (input ?? '').trim()
  if (!raw) return null

  // Pull out the query string, whichever of the three forms was pasted.
  let search = ''
  if (/^https?:\/\//i.test(raw)) {
    let url: URL
    try { url = new URL(raw) } catch { return null }
    // It has to BE a construct search; the host is then thrown away and only the criteria
    // kept, so a link copied from localhost or a preview deploy still points at this app.
    if (!url.pathname.endsWith('/search/construct')) return null
    search = url.search
  } else if (raw.startsWith('/')) {
    if (!raw.split('?')[0].endsWith('/search/construct')) return null
    search = raw.slice(raw.indexOf('?') + 1)
    if (!raw.includes('?')) return null
  } else {
    search = raw
  }

  const params = new URLSearchParams(search.replace(/^\?/, ''))
  if (!params.get('c')) return null
  const query = decodeConstruct(Object.fromEntries(params.entries()))
  if (!queryIsRunnable(query)) return null

  return { href: `/search/construct?${params.toString()}`, query }
}

/** The stored reference re-read as a search, or null if it was never a construct link. */
export function constructLinkFromReference(reference: string | null | undefined): ParsedConstructLink | null {
  return reference ? parseConstructLink(reference) : null
}

// ─── Plain-language echo ──────────────────────────────────────────────────────

function describeTerm(t: ConstructTerm): string {
  const feats = Object.values(t.features).flat().map(v => FEATURE_LABEL.get(v) ?? v)
  const desc = feats.length ? feats.join(' ') : 'any word'
  const withLemma = t.lemma ? `${desc} (${t.lemma})` : desc
  // Agreement is part of what the construct MEANS, so it belongs in the echo, not just the form.
  return t.agreeOn?.length && t.agreeWith !== undefined
    ? `${withLemma} agreeing with word ${t.agreeWith + 1} in ${t.agreeOn.join('/')}`
    : withLemma
}

/**
 * "aorist participle + genitive noun · within 4 words, same verse" — the search said back in
 * words, so an assignment can show what it asks for without running it. Shared with the
 * construct search page, which prints the same line above its results.
 */
export function describeConstruct(q: ConstructQuery): string {
  const used = q.terms.filter(t => !termIsEmpty(t))
  const positive = used.filter(t => !t.negate)
  const forbidden = used.filter(t => t.negate)
  const join = q.ordered ? ' then ' : ' + '
  const head = positive.map(describeTerm).join(join)
  const tail = forbidden.length
    ? `, with no ${forbidden.map(describeTerm).join(' or ')} in between`
    : ''
  const scoped = q.books?.length
    ? `, in ${q.books.length} ${isProseCorpus(q.corpus) ? 'work' : 'book'}${q.books.length === 1 ? '' : 's'}`
    : ''
  return `${head} · within ${q.within} word${q.within === 1 ? '' : 's'}${q.ordered ? ', in order' : ''}${q.sameVerse ? ', same verse' : ''}${scoped}${tail}`
}

/** Which text the search runs over, for a badge next to the description. */
export function constructCorpusLabel(q: ConstructQuery): string {
  return q.corpus === CONSTRUCT_ALL ? 'All Greek texts' : corpusInfo(q.corpus).label
}
