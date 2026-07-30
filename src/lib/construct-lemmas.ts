// Server-side lemma lookup for Construct search's word field.
//
// The New Testament table is small enough to ship to the browser (lemma-forms-gnt.json), so its
// word field matches locally and responds per keystroke. The Septuagint's is 44,249 lemmas / 8 MB,
// which no page should carry, so it ships gzipped and is queried here instead — the same trade the
// rest of the app makes for its big indexes (see search.ts).

import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { normalizeGreek } from './greek-utils'
import type { LemmaForms } from './construct-query'

type Table = Record<string, LemmaForms>
const _cache: Record<string, Table> = {}

function getTable(corpus: string): Table {
  const key = corpus.toUpperCase()
  if (_cache[key]) return _cache[key]
  const stem = `lemma-forms-${key.toLowerCase()}`
  const dir = path.join(process.cwd(), 'public', 'data')
  try {
    // Either form is acceptable; the GNT's is plain, the LXX's gzipped.
    const gz = path.join(dir, `${stem}.json.gz`)
    const raw = fs.existsSync(gz)
      ? zlib.gunzipSync(fs.readFileSync(gz)).toString('utf8')
      : fs.readFileSync(path.join(dir, `${stem}.json`), 'utf8')
    _cache[key] = JSON.parse(raw) as Table
  } catch {
    _cache[key] = {}
  }
  return _cache[key]
}

export interface LemmaSuggestion {
  display: string
  gloss: string
  count: number
  pos: string
}

// Prefix matches first, then anything containing the string, each ranked by how often the word
// occurs — the same ordering the browser-side matcher uses, so the two feel identical.
export function suggestLemmas(corpus: string, query: string, limit = 8): LemmaSuggestion[] {
  const q = normalizeGreek(query.trim())
  if (q.length < 2) return []
  const table = getTable(corpus)
  const starts: { key: string; e: LemmaForms }[] = []
  const contains: { key: string; e: LemmaForms }[] = []
  for (const key in table) {
    if (key.startsWith(q)) starts.push({ key, e: table[key] })
    else if (key.includes(q)) contains.push({ key, e: table[key] })
  }
  const byFreq = (a: { e: LemmaForms }, b: { e: LemmaForms }) => Number(b.e.n ?? 0) - Number(a.e.n ?? 0)
  starts.sort(byFreq); contains.sort(byFreq)
  return [...starts, ...contains].slice(0, limit).map(({ key, e }) => ({
    display: (e.d as unknown as string) || key,
    gloss: (e.g as unknown as string) || '',
    count: Number(e.n ?? 0),
    pos: e.p?.[0] ?? '',
  }))
}

// The exact entry for a typed lemma, which is what narrows that card's form controls.
export function lemmaEntry(corpus: string, query: string): LemmaForms | null {
  const q = normalizeGreek(query.trim())
  if (!q) return null
  return getTable(corpus)[q] ?? null
}
