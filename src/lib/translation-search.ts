import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

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

/** Verses in the given translation whose text contains the query (accent-insensitive). */
export async function searchTranslation(lang: string, query: string, limit = 300): Promise<{ id: string; text: string }[]> {
  const data = await load(lang)
  if (!data) return []
  const q = normalize(query.trim())
  if (!q) return []
  const out: { id: string; text: string }[] = []
  for (let i = 0; i < data.entries.length; i++) {
    if (data.normalized[i].includes(q)) {
      out.push({ id: data.entries[i].id, text: data.entries[i].t })
      if (out.length >= limit) break
    }
  }
  return out
}
