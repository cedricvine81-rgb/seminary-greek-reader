// Build full-text search indexes over the whole Texts-library "background sources" corpus
// (Philo, Josephus, the Septuagint + Brenton English, Apocrypha, Pseudepigrapha, the
// Testaments) so they can be searched together — the counterpart to the canonical-Bible
// indexes built by build-translation-index.mjs. Two facets are written:
//
//   public/data/backgrounds-search-en.json.gz   — English (prose works + Brenton)
//   public/data/backgrounds-search-grc.json.gz  — Greek (Septuagint)
//   public/data/backgrounds-search-es.json.gz   — OUR OWN Spanish (see src/lib/spanish-texts.ts)
//
// The `es` facet covers only the works we translated ourselves — the Apocrypha collection and
// Josephus. It exists so a reader who has the Spanish column open can right-click a Spanish word
// and actually find it; searching that word against the `en` facet returns nothing, which reads
// like the text is missing.
//
// Each is a JSON array of compact entries { g, s, o?, w?, b?, c, v, t } — enough for the
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
// w = workDir (josephus), b = book, c = chapter, v = verse, t = searchable text.
interface Entry { g: string; s: string; o?: string; w?: string; b?: number; c: number; v: number; t: string }

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

function write(name: string, entries: Entry[]) {
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(entries), 'utf8'))
  fs.writeFileSync(path.join(DATA, name), gz)
  const bySrc = entries.reduce<Record<string, number>>((a, e) => { a[e.g] = (a[e.g] ?? 0) + 1; return a }, {})
  console.log(`${name}: ${entries.length} entries, ${(gz.length / 1e6).toFixed(2)} MB gz, ${Object.keys(bySrc).length} works`)
}

write('backgrounds-search-en.json.gz', en)
write('backgrounds-search-grc.json.gz', grc)
write('backgrounds-search-es.json.gz', es)
