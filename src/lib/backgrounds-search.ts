import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { parseSearchTerms, textMatchesTerms } from '@/lib/search-query'
import { normalizeGreek as normalize } from '@/lib/greek-utils'
import { findProseWork } from '@/lib/prose-texts'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import type { BgLang, BgHit, BgGroup, BgResult } from '@/lib/backgrounds-search-types'

// Full-text search over the background-source corpus (Philo, Josephus, the Septuagint,
// Apocrypha, Pseudepigrapha, the Testaments), using the gzipped indexes built by
// scripts/build-backgrounds-search.ts. Like src/lib/translation-search.ts, the indexes are
// fetched from the deployment's own static assets in production (they're excluded from the
// function bundle in next.config.js) and read from disk in dev. Loaded once per facet.

export type { BgLang, BgHit, BgGroup, BgResult }

// Stored entry: g = group id (catalog work id), s = target source, o/w/b = osisId/workDir/
// book, c/v = chapter/verse, t = text, x = index into `trans` (a Greek entry's aligned English,
// baked at build time). Mirrors build-backgrounds-search.ts.
interface Entry { g: string; s: string; o?: string; w?: string; b?: number; c: number; v: number; t: string; x?: number }
interface Loaded { entries: Entry[]; normalized: string[]; trans: string[] }

const _cache = new Map<BgLang, Loaded | null>()

// Catalog metadata for building display labels/targets at query time (keeps it out of the index).
const _meta = new Map<string, { name: string; chapters: number; order: number }>()
// Work id → its catalog category id, so the master search can scope to one collection.
const _categoryOf = new Map<string, string>()
;(() => {
  let order = 0
  for (const cat of TEXT_CATEGORIES) for (const w of cat.works) {
    _meta.set(w.id, { name: w.name, chapters: w.chapters ?? 1, order: order++ })
    _categoryOf.set(w.id, cat.id)
  }
})()

async function readIndexRaw(lang: BgLang): Promise<string | null> {
  const rel = `backgrounds-search-${lang}.json.gz`
  const host = process.env.VERCEL_ENV === 'production'
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL
  if (host) {
    try {
      const res = await fetch(`https://${host}/data/${rel}`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      try { return zlib.gunzipSync(buf).toString('utf8') } catch { return buf.toString('utf8') }
    } catch { return null }
  }
  try {
    return zlib.gunzipSync(fs.readFileSync(path.join(process.cwd(), 'public', 'data', rel))).toString('utf8')
  } catch { return null }
}

async function load(lang: BgLang): Promise<Loaded | null> {
  if (_cache.has(lang)) return _cache.get(lang)!
  let loaded: Loaded | null = null
  const raw = await readIndexRaw(lang)
  if (raw) {
    try {
      // { entries, trans? } since translations were baked in; tolerate the bare array a previous
      // deployment's file may still be, so a stale asset degrades to "no translations shown"
      // rather than throwing the whole search away.
      const doc: Entry[] | { entries: Entry[]; trans?: string[] } = JSON.parse(raw)
      const entries = Array.isArray(doc) ? doc : doc.entries
      loaded = { entries, normalized: entries.map(e => normalize(e.t)), trans: Array.isArray(doc) ? [] : doc.trans ?? [] }
    } catch { loaded = null }
  }
  _cache.set(lang, loaded)
  return loaded
}

function targetFor(e: Entry): OpenInTextsTarget {
  return { source: e.s as OpenInTextsTarget['source'], osisId: e.o, workDir: e.w, book: e.b, chapter: e.c, verse: e.v }
}

function labelFor(e: Entry, name: string, chapters: number): string {
  if (e.s === 'josephus') return `${name} ${e.b}.${e.c}.${e.v}`
  if (e.s === 'lxx') return `${name} ${e.c}:${e.v}`
  return chapters > 1 ? `${name} ${e.c}:${e.v}` : `${name} ${e.v}`   // prose
}

/**
 * Search the background corpus. Results are grouped by work, ordered by the catalog, each
 * carrying an OpenInTextsTarget so the caller can open the hit in the Texts reader.
 */
export async function searchBackgrounds(query: string, lang: BgLang, limit = 300, category?: string | null, work?: string | null): Promise<BgResult> {
  const data = await load(lang)
  // Phrase/boolean: "quoted" = exact phrase, bare words = AND (see search-query.ts).
  const terms = parseSearchTerms(query)
  if (!data || query.trim().length < 2 || terms.length === 0) return { lang, total: 0, truncated: false, groups: [] }

  // A Greek hit's aligned English comes from the file's own `trans` table (entry.x), baked by the
  // builder — including the Josephus rule that Whiston's English sits only on each translator
  // section's first §, so most §§ borrow the containing section's text.
  //
  // This used to load the whole `en` index on every Greek search — 119,640 entries, ~204 MB of
  // heap, ~0.8 s — to decorate at most 300 hits, so one Greek search paid for both facets: ~395 MB
  // and ~3 s on a cold instance. The alignment cannot change between builds, so it is build-time
  // work, not per-request work.

  const byGroup = new Map<string, BgHit[]>()
  let total = 0
  let truncated = false
  for (let i = 0; i < data.entries.length; i++) {
    if (!textMatchesTerms(data.normalized[i], terms)) continue
    // Collection scope: skip hits whose work isn't in the requested category.
    if (category && _categoryOf.get(data.entries[i].g) !== category) continue
    // Work scope: the Texts reader searches the work the reader has open, nothing else.
    if (work && data.entries[i].g !== work) continue
    if (total >= limit) { truncated = true; break }
    const e = data.entries[i]
    const meta = _meta.get(e.g) ?? { name: e.g, chapters: 1, order: 999 }
    const hit: BgHit = { ref: labelFor(e, meta.name, meta.chapters), text: e.t, target: targetFor(e) }
    if (e.x !== undefined) hit.trans = data.trans[e.x]
    const arr = byGroup.get(e.g)
    if (arr) arr.push(hit)
    else byGroup.set(e.g, [hit])
    total++
  }

  const groups: BgGroup[] = Array.from(byGroup.entries())
    .map(([gid, hits]) => ({ gid, name: _meta.get(gid)?.name ?? gid, count: hits.length, hits }))
    .sort((a, b) => (_meta.get(a.gid)?.order ?? 999) - (_meta.get(b.gid)?.order ?? 999))
  return { lang, total, truncated, groups }
}

// ── Verse/section context for the search page's slider ──────────────────────────────────────
// A hit's neighbours are simply the adjacent entries in the same group `g` (the builder writes
// each work's sections contiguously, in document order), so no per-source JSON parsing is needed.
export interface BgCtxVerse { chapter: number; verse: number; text: string }
// Key identifying an entry from an OpenInTextsTarget (which carries no group id) — the client
// builds the same key from a hit's target so the response can be matched back.
function entryKey(e: { s: string; o?: string; w?: string; b?: number; c: number; v: number }): string {
  return `${e.s}|${e.o ?? ''}|${e.w ?? ''}|${e.b ?? ''}|${e.c}|${e.v}`
}
const _posCache = new Map<BgLang, Map<string, number>>()
async function positions(lang: BgLang): Promise<{ loaded: Loaded; pos: Map<string, number> } | null> {
  const loaded = await load(lang)
  if (!loaded) return null
  let pos = _posCache.get(lang)
  if (!pos) {
    pos = new Map()
    for (let i = 0; i < loaded.entries.length; i++) pos.set(entryKey(loaded.entries[i]), i)
    _posCache.set(lang, pos)
  }
  return { loaded, pos }
}

/** Given entry keys ("source|osis|work|book|chapter|verse") return each one's ±radius neighbouring
 *  sections within the same work, so a background hit can be read in context. */
export async function getBackgroundContext(lang: BgLang, refKeys: string[], radius: number): Promise<Record<string, BgCtxVerse[]>> {
  const p = await positions(lang)
  if (!p) return {}
  const { loaded, pos } = p
  const r = Math.max(1, Math.min(3, radius))
  const out: Record<string, BgCtxVerse[]> = {}
  for (const key of refKeys) {
    const i = pos.get(key)
    if (i === undefined) { out[key] = []; continue }
    const g = loaded.entries[i].g
    const arr: BgCtxVerse[] = []
    for (let j = Math.max(0, i - r); j <= Math.min(loaded.entries.length - 1, i + r); j++) {
      const e = loaded.entries[j]
      if (e.g !== g) continue
      arr.push({ chapter: e.c, verse: e.v, text: e.t })
    }
    out[key] = arr
  }
  return out
}

// Greek script detection so callers can pick the facet automatically.
export function detectLang(s: string): BgLang {
  return /[Ͱ-Ͽἀ-῿]/.test(s) ? 'grc' : 'en'
}
