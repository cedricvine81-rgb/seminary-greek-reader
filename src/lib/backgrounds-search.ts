import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { TEXT_CATEGORIES } from '@/lib/texts-catalog'
import { parseSearchTerms, textMatchesTerms } from '@/lib/search-query'
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
// book, c/v = chapter/verse, t = text. (Mirrors build-backgrounds-search.ts.)
interface Entry { g: string; s: string; o?: string; w?: string; b?: number; c: number; v: number; t: string }
interface Loaded { entries: Entry[]; normalized: string[] }

const _cache = new Map<BgLang, Loaded | null>()

// Lowercase + strip combining diacritics (identical to normalizeGreek) so accents and case
// don't matter for either facet.
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

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
      const entries: Entry[] = JSON.parse(raw)
      loaded = { entries, normalized: entries.map(e => normalize(e.t)) }
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
export async function searchBackgrounds(query: string, lang: BgLang, limit = 300, category?: string | null): Promise<BgResult> {
  const data = await load(lang)
  // Phrase/boolean: "quoted" = exact phrase, bare words = AND (see search-query.ts).
  const terms = parseSearchTerms(query)
  if (!data || query.trim().length < 2 || terms.length === 0) return { lang, total: 0, truncated: false, groups: [] }

  const byGroup = new Map<string, BgHit[]>()
  let total = 0
  let truncated = false
  for (let i = 0; i < data.entries.length; i++) {
    if (!textMatchesTerms(data.normalized[i], terms)) continue
    // Collection scope: skip hits whose work isn't in the requested category.
    if (category && _categoryOf.get(data.entries[i].g) !== category) continue
    if (total >= limit) { truncated = true; break }
    const e = data.entries[i]
    const meta = _meta.get(e.g) ?? { name: e.g, chapters: 1, order: 999 }
    const hit: BgHit = { ref: labelFor(e, meta.name, meta.chapters), text: e.t, target: targetFor(e) }
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

// Greek script detection so callers can pick the facet automatically.
export function detectLang(s: string): BgLang {
  return /[Ͱ-Ͽἀ-῿]/.test(s) ? 'grc' : 'en'
}
