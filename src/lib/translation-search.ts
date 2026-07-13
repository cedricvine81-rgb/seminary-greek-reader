import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { parseSearchTerms, textMatchesTerms, scoreRelevance } from '@/lib/search-query'

// Full-text search over a parallel translation, using the gzipped indexes built by
// scripts/build-translation-index.mjs (public/data/search-index-<lang>.json.gz).
//
// Like src/lib/reader.ts, in production these are fetched from the deployment's own static
// assets rather than read via fs — the files are excluded from the function bundle in
// next.config.js (they'd otherwise bloat it). Loaded once per language, then cached.

interface TransEntry { id: string; t: string }
interface Loaded { entries: TransEntry[]; normalized: string[] }

const _cache = new Map<string, Loaded | null>()
// BSB has no separate index; it's English, so it searches the WEB ('en') index.
const LANG_ALIAS: Record<string, string> = { bsb: 'en' }

// Lowercase + strip combining diacritics so "principio" matches "Principió" etc.
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

async function readIndexRaw(key: string): Promise<string | null> {
  const rel = `search-index-${key}.json.gz`
  const host = process.env.VERCEL_ENV === 'production'
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL
  if (host) {
    try {
      const res = await fetch(`https://${host}/data/${rel}`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      // Served as raw bytes → gunzip. If a proxy transparently decompressed it, it's already JSON.
      try { return zlib.gunzipSync(buf).toString('utf8') } catch { return buf.toString('utf8') }
    } catch { return null }
  }
  // Dev / non-Vercel: read from disk.
  try {
    return zlib.gunzipSync(fs.readFileSync(path.join(process.cwd(), 'public', 'data', rel))).toString('utf8')
  } catch { return null }
}

async function load(lang: string): Promise<Loaded | null> {
  const key = LANG_ALIAS[lang] ?? lang
  if (_cache.has(key)) return _cache.get(key)!
  let loaded: Loaded | null = null
  const raw = await readIndexRaw(key)
  if (raw) {
    try {
      const entries: TransEntry[] = JSON.parse(raw)
      loaded = { entries, normalized: entries.map(e => normalize(e.t)) }
    } catch { loaded = null }
  }
  _cache.set(key, loaded)
  return loaded
}

// Per-language autocomplete vocabulary (normalized form → most frequent spelling), lazy.
const _vocab = new Map<string, { norm: string; display: string; count: number }[]>()

// Keep only letters (Latin+accents, Greek, Cyrillic, Hangul, CJK); drop punctuation/digits.
const WORD_STRIP = /[^A-Za-zÀ-ɏͰ-῿가-힣一-鿿]/g

async function getVocab(lang: string) {
  const key = LANG_ALIAS[lang] ?? lang
  if (_vocab.has(key)) return _vocab.get(key)!
  const data = await load(lang)
  const list: { norm: string; display: string; count: number }[] = []
  if (data) {
    const byNorm = new Map<string, { count: number; forms: Map<string, number> }>()
    for (const e of data.entries) {
      for (const raw of e.t.split(/\s+/)) {
        const token = raw.replace(WORD_STRIP, '')
        if (token.length < 2) continue
        const norm = normalize(token)
        if (!norm) continue
        let x = byNorm.get(norm)
        if (!x) { x = { count: 0, forms: new Map() }; byNorm.set(norm, x) }
        x.count++
        x.forms.set(token, (x.forms.get(token) ?? 0) + 1)
      }
    }
    for (const [norm, x] of Array.from(byNorm.entries())) {
      let display = '', best = 0
      for (const [f, n] of Array.from(x.forms.entries())) if (n > best) { display = f; best = n }
      list.push({ norm, display, count: x.count })
    }
    list.sort((a, b) => b.count - a.count)
  }
  _vocab.set(key, list)
  return list
}

/** Up to `limit` words in the translation beginning with `prefix`, most common first. */
export async function suggestTranslation(lang: string, prefix: string, limit = 12): Promise<string[]> {
  const p = normalize(prefix)
  if (p.length < 2) return []
  const vocab = await getVocab(lang)
  const out: string[] = []
  for (const w of vocab) {
    if (w.norm.startsWith(p)) { out.push(w.display); if (out.length >= limit) break }
  }
  return out
}

/** For each requested verse, the surrounding verses in the SAME chapter within `radius`
 *  (clamped to the chapter — context never crosses a chapter/book boundary). Keyed by the
 *  original "osisId.chapter.verse". Used by the search page's verse-context slider. */
export async function getTranslationContext(
  lang: string,
  refs: { osisId: string; chapter: number; verse: number }[],
  radius: number,
): Promise<Record<string, { verse: number; text: string }[]>> {
  const out: Record<string, { verse: number; text: string }[]> = {}
  const data = await load(lang)
  if (!data) return out
  // Index the whole translation by book.chapter once, then answer every ref from it.
  const byChapter = new Map<string, { verse: number; text: string }[]>()
  for (const e of data.entries) {
    const dot1 = e.id.indexOf('.')
    const dot2 = e.id.indexOf('.', dot1 + 1)
    if (dot1 < 0 || dot2 < 0) continue
    const key = e.id.slice(0, dot2)
    const verse = Number(e.id.slice(dot2 + 1))
    let arr = byChapter.get(key)
    if (!arr) { arr = []; byChapter.set(key, arr) }
    arr.push({ verse, text: e.t })
  }
  for (const arr of Array.from(byChapter.values())) arr.sort((a: { verse: number }, b: { verse: number }) => a.verse - b.verse)
  for (const r of refs) {
    const arr = byChapter.get(`${r.osisId}.${r.chapter}`) ?? []
    out[`${r.osisId}.${r.chapter}.${r.verse}`] = arr.filter(x => x.verse >= r.verse - radius && x.verse <= r.verse + radius)
  }
  return out
}

/** Verses in the given translation whose text contains the query (accent-insensitive).
 *  `books` (osisIds) scopes to one or more books — applied during the scan so their hits
 *  aren't lost to the result cap when they fall late in the canon (e.g. "love" in Matthew). */
export async function searchTranslation(lang: string, query: string, limit = 300, books?: string[] | null, rank = false): Promise<{ id: string; text: string }[]> {
  const data = await load(lang)
  if (!data) return []
  // Phrase/boolean: "quoted" = exact phrase, bare words = AND. Single words are unchanged.
  const terms = parseSearchTerms(query)
  if (!terms.length) return []
  const bookSet = books && books.length ? new Set(books) : null

  // Relevance sort needs every match scored, so it can't early-stop at the cap like the
  // canonical scan (which returns matches in reading order and stops once it has `limit`).
  if (rank) {
    const scored: { id: string; text: string; s: number }[] = []
    for (let i = 0; i < data.entries.length; i++) {
      if (bookSet && !bookSet.has(data.entries[i].id.split('.')[0])) continue
      if (textMatchesTerms(data.normalized[i], terms)) {
        scored.push({ id: data.entries[i].id, text: data.entries[i].t, s: scoreRelevance(data.normalized[i], terms) })
      }
    }
    scored.sort((a, b) => b.s - a.s)
    return scored.slice(0, limit).map(({ id, text }) => ({ id, text }))
  }

  const out: { id: string; text: string }[] = []
  for (let i = 0; i < data.entries.length; i++) {
    if (bookSet && !bookSet.has(data.entries[i].id.split('.')[0])) continue
    if (textMatchesTerms(data.normalized[i], terms)) {
      out.push({ id: data.entries[i].id, text: data.entries[i].t })
      if (out.length >= limit) break
    }
  }
  return out
}
