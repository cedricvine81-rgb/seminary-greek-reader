// Build full-text search indexes over the whole Texts-library "background sources" corpus
// (Philo, Josephus, the Septuagint + Brenton English, Apocrypha, Pseudepigrapha, the
// Testaments) so they can be searched together — the counterpart to the canonical-Bible
// indexes built by build-translation-index.mjs. Two facets are written:
//
//   public/data/backgrounds-search/<lang>/<category>.json.gz
//
// Sharded by catalogue collection, because the index is held in a serverless instance's memory
// and those instances are recycled while the app is quiet — so at low traffic a search usually
// pays to load the whole thing. Measured in production: 1–3 s per search. Almost every search is
// already scoped (the Texts search box passes work=, the word menu passes category=), so a shard
// is all it needs: Apocrypha is 0.32 MB against the English facet's 20.5 MB, Josephus 1.37 MB.
// Only the all-collections scope loads every shard, and the shards sum to the same total, so
// nothing is paid for that case.
//
// Facets: en (prose works + Brenton), grc (Septuagint + Greek prose), es (OUR OWN Spanish,
// see src/lib/spanish-texts.ts).
//
// The `es` facet covers only the works we translated ourselves — the Apocrypha collection and
// Josephus. It exists so a reader who has the Spanish column open can right-click a Spanish word
// and actually find it; searching that word against the `en` facet returns nothing, which reads
// like the text is missing.
//
// Each file is { entries: [ { g, s, o?, w?, b?, c, v, t, x? } ], trans?: string[] } — enough for the
// query lib (src/lib/backgrounds-search.ts) to make a snippet and an OpenInTextsTarget
// ({ source, osisId?, workDir?, book?, chapter, verse } — see BackgroundsView.tsx). The
// display name/label is looked up from the catalog at query time, so it isn't stored here.
//
// Enumerates the corpus straight from the catalog + prose registry (no drift):
//   Usage:  npx tsx scripts/build-backgrounds-search.ts   (run from the repo root)

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { TEXT_CATEGORIES, type CatalogWork } from '../src/lib/texts-catalog'
import { findProseWork } from '../src/lib/prose-texts'
import { DEUTERO_ES_BOOKS, ES_PROSE_WORKS, ES_ENGLISH_PROSE_WORKS } from '../src/lib/spanish-texts'

const DATA = path.join(process.cwd(), 'public', 'data')

// g = group id (catalog work id), s = OpenInTextsTarget.source, o = osisId (lxx),
// w = workDir (josephus), b = book, c = chapter, v = verse, t = searchable text,
// x = index into the file's `trans` table: this entry's aligned translation, for Greek entries
//     whose work has an English alongside (Josephus/Whiston, Greco-Roman/Perseus).
//
// `x` is baked here rather than looked up at query time on purpose. The query lib used to load
// the ENTIRE English index (119,640 entries, ~204 MB of heap, ~0.8 s) on every Greek search just
// to attach a translation to at most 300 hits — so one Greek search cost both facets, ~395 MB and
// ~3 s on a cold serverless instance. The alignment is fixed at build time, so it belongs here.
interface Entry { g: string; s: string; o?: string; w?: string; b?: number; c: number; v: number; t: string; x?: number }

const en: Entry[] = []
const grc: Entry[] = []
const es: Entry[] = []

function readJson(rel: string): any | null {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8')) } catch { return null }
}

// ── Prose works (Philo, Josephus is separate, Pseudepigrapha, Testaments, 2 Esdras) ──
function indexProse(work: CatalogWork) {
  const prose = findProseWork(work.source)
  if (!prose) return
  const doc = readJson(prose.dataUrl.replace(/^\/data\//, ''))
  if (!doc?.chapters) return
  // Our Spanish for an English-only prose work sits one file per chapter, keyed by verse.
  const esDir = ES_ENGLISH_PROSE_WORKS[work.id]
  for (const ch of doc.chapters) {
    const esCh: Record<string, string> = esDir
      ? (readJson(path.join('es', esDir, `${ch.number}.json`))?.verses ?? {})
      : {}
    for (const vs of ch.verses) {
      const esText = esCh[String(vs.number)]
      if (esText) es.push({ g: work.id, s: work.source, c: ch.number, v: vs.number, t: esText })
      if (vs.text) en.push({ g: work.id, s: work.source, c: ch.number, v: vs.number, t: vs.text })
      // The grc facet is labelled Greek and folds Greek diacritics, so a Hebrew-script work
      // (the Talmud Bavli's Aramaic) is excluded rather than filed under it. Its text is read
      // in Texts; giving Aramaic its own facet is a separate job.
      if (vs.greek && work.script !== 'hebrew') grc.push({ g: work.id, s: work.source, c: ch.number, v: vs.number, t: vs.greek })
    }
  }
}

// ── Septuagint / Apocrypha: Greek from lxx/<osisId>_<ch>.json, English from Brenton ──
function indexLxx(work: CatalogWork) {
  const osisId = work.osisId!
  for (let c = 1; c <= (work.chapters ?? 0); c++) {
    const chap = readJson(path.join('lxx', `${osisId}_${c}.json`))
    if (chap?.verses) for (const vs of chap.verses) {
      if (vs.text) grc.push({ g: work.id, s: 'lxx', o: osisId, c, v: vs.verse, t: vs.text })
    }
    // Our Spanish, keyed by the same verse ids as the Greek — walked in the Greek's own order
    // so the es facet stays in document order (getBackgroundContext reads neighbours by index).
    if (DEUTERO_ES_BOOKS.has(osisId)) {
      const esCh: Record<string, string> = readJson(path.join('deutero-es', `${osisId}_${c}.json`))?.verses ?? {}
      if (chap?.verses) for (const vs of chap.verses) {
        const t = esCh[String(vs.verse)]
        if (t) es.push({ g: work.id, s: 'lxx', o: osisId, c, v: vs.verse, t })
      }
    }
  }
  if (work.english === 'brenton') {
    const bren = readJson(path.join('brenton', `${osisId}.json`))
    if (bren) for (const [key, text] of Object.entries(bren as Record<string, string>)) {
      const m = key.match(/\.(\d+)\.(\d+)$/)               // "Osis.chapter.verse"
      if (m && text) en.push({ g: work.id, s: 'lxx', o: osisId, c: +m[1], v: +m[2], t: text })
    }
  }
}

// ── Josephus: josephus/<workDir>/<book>.json = { chapters:[{ number, sections:[…] }] } ──
function indexJosephus(work: CatalogWork) {
  const workDir = work.work!
  const nBooks = work.books?.length ?? 0
  for (let b = 1; b <= nBooks; b++) {
    const book = readJson(path.join('josephus', workDir, `${b}.json`))
    if (!book?.chapters) continue
    // Our Spanish is keyed by Niese §, so it lines up section-for-section with the Greek —
    // unlike Whiston's English, which is attached once per Whiston section (its first §).
    const esDir = ES_PROSE_WORKS[work.id]
    const esBook: Record<string, string> = esDir
      ? (readJson(path.join('es', esDir, `${b}.json`))?.sections ?? {})
      : {}
    for (const ch of book.chapters) {
      for (const sec of ch.sections) {
        if (sec.text) en.push({ g: work.id, s: 'josephus', w: workDir, b, c: ch.number, v: sec.number, t: sec.text })
        if (sec.greek) grc.push({ g: work.id, s: 'josephus', w: workDir, b, c: ch.number, v: sec.number, t: sec.greek })
        const esText = esBook[String(sec.number)]
        if (esText) es.push({ g: work.id, s: 'josephus', w: workDir, b, c: ch.number, v: sec.number, t: esText })
      }
    }
  }
}

for (const cat of TEXT_CATEGORIES) {
  for (const work of cat.works) {
    if (work.source === 'lxx') indexLxx(work)
    else if (work.source === 'josephus') indexJosephus(work)
    else indexProse(work)
  }
}

// ── Bake each Greek entry's aligned English into a string table ──────────────────────────────
// Same rule the query lib applied at runtime: an exact same-position match in the English index,
// and for Josephus a fallback to the CONTAINING Whiston section (Whiston's English is attached
// only to each translator-section's first §, so most §§ have no exact match of their own).
function entryKey(e: Entry): string {
  return `${e.s}|${e.o ?? ''}|${e.w ?? ''}|${e.b ?? ''}|${e.c}|${e.v}`
}

function bakeTranslations(): string[] {
  const pos = new Map<string, number>()
  en.forEach((e, i) => pos.set(entryKey(e), i))
  // Sorted English section-start §§ per Josephus (work, book, chapter).
  const josSections = new Map<string, number[]>()
  for (const e of en) {
    if (e.s !== 'josephus') continue
    const k = `${e.w}|${e.b}|${e.c}`
    const arr = josSections.get(k)
    if (arr) arr.push(e.v)
    else josSections.set(k, [e.v])
  }
  for (const arr of Array.from(josSections.values())) arr.sort((a: number, b: number) => a - b)

  const table: string[] = []
  const seen = new Map<string, number>()
  for (const e of grc) {
    let i = pos.get(entryKey(e))
    if (i === undefined && e.s === 'josephus') {
      const arr = josSections.get(`${e.w}|${e.b}|${e.c}`)
      if (arr) {
        let sec: number | null = null
        for (const v of arr) { if (v <= e.v) sec = v; else break }
        if (sec !== null) i = pos.get(entryKey({ ...e, v: sec }))
      }
    }
    if (i === undefined) continue
    const text = en[i].t
    let ref = seen.get(text)
    if (ref === undefined) { ref = table.length; table.push(text); seen.set(text, ref) }
    e.x = ref
  }
  console.log(`baked translations: ${grc.filter(e => e.x !== undefined).length}/${grc.length} Greek entries, ${table.length} distinct strings`)
  return table
}

const grcTrans = bakeTranslations()

// Work id -> catalogue category, for splitting the flat arrays into shards.
const CATEGORY_OF = new Map<string, string>()
for (const cat of TEXT_CATEGORIES) for (const w of cat.works) CATEGORY_OF.set(w.id, cat.id)

/**
 * Write one facet as per-collection shards. Entries keep the order they were built in, which is
 * catalogue order — the query lib reads a hit's neighbours by array index, so document order is
 * load-bearing, and concatenating the shards back in catalogue order must reproduce the original
 * array exactly.
 *
 * Each shard carries its own `trans` table holding only the strings its own entries reference,
 * with `x` remapped into it: an index into a table the shard does not ship would be meaningless.
 */
function writeFacet(lang: string, entries: Entry[], trans: string[] = []) {
  const dir = path.join(DATA, 'backgrounds-search', lang)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })

  const byCategory = new Map<string, Entry[]>()
  for (const e of entries) {
    const cat = CATEGORY_OF.get(e.g)
    if (!cat) continue                     // a work not in the catalogue is unreachable anyway
    const arr = byCategory.get(cat)
    if (arr) arr.push(e)
    else byCategory.set(cat, [e])
  }

  let total = 0
  const parts: string[] = []
  for (const [cat, rows] of Array.from(byCategory.entries())) {
    const table: string[] = []
    const remap = new Map<number, number>()
    const shaped = rows.map(e => {
      if (e.x === undefined) return e
      let i = remap.get(e.x)
      if (i === undefined) { i = table.length; table.push(trans[e.x]); remap.set(e.x, i) }
      return { ...e, x: i }
    })
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(table.length ? { entries: shaped, trans: table } : { entries: shaped }), 'utf8'))
    fs.writeFileSync(path.join(dir, `${cat}.json.gz`), gz)
    total += gz.length
    parts.push(`${cat} ${(gz.length / 1e6).toFixed(2)}MB`)
  }
  console.log(`backgrounds-search/${lang}/: ${entries.length} entries in ${byCategory.size} shards, ${(total / 1e6).toFixed(2)} MB gz`)
  console.log(`   ${parts.join(' · ')}`)
}

writeFacet('en', en)
writeFacet('grc', grc, grcTrans)
writeFacet('es', es)

// The monolithic files are replaced by the shards above.
for (const lang of ['en', 'grc', 'es']) {
  const old = path.join(DATA, `backgrounds-search-${lang}.json.gz`)
  if (fs.existsSync(old)) { fs.rmSync(old); console.log(`removed ${path.basename(old)}`) }
}
