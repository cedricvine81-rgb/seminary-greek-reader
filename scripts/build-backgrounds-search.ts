// Build full-text search indexes over the whole Texts-library "background sources" corpus
// (Philo, Josephus, the Septuagint + Brenton English, Apocrypha, Pseudepigrapha, the
// Testaments) so they can be searched together — the counterpart to the canonical-Bible
// indexes built by build-translation-index.mjs. Two facets are written:
//
//   public/data/backgrounds-search-en.json.gz   — English (prose works + Brenton)
//   public/data/backgrounds-search-grc.json.gz  — Greek (Septuagint)
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

const DATA = path.join(process.cwd(), 'public', 'data')

// g = group id (catalog work id), s = OpenInTextsTarget.source, o = osisId (lxx),
// w = workDir (josephus), b = book, c = chapter, v = verse, t = searchable text.
interface Entry { g: string; s: string; o?: string; w?: string; b?: number; c: number; v: number; t: string }

const en: Entry[] = []
const grc: Entry[] = []

function readJson(rel: string): any | null {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8')) } catch { return null }
}

// ── Prose works (Philo, Josephus is separate, Pseudepigrapha, Testaments, 2 Esdras) ──
function indexProse(work: CatalogWork) {
  const prose = findProseWork(work.source)
  if (!prose) return
  const doc = readJson(prose.dataUrl.replace(/^\/data\//, ''))
  if (!doc?.chapters) return
  for (const ch of doc.chapters) {
    for (const vs of ch.verses) {
      if (vs.text) en.push({ g: work.id, s: work.source, c: ch.number, v: vs.number, t: vs.text })
      if (vs.greek) grc.push({ g: work.id, s: work.source, c: ch.number, v: vs.number, t: vs.greek })
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
    for (const ch of book.chapters) {
      for (const sec of ch.sections) {
        if (sec.text) en.push({ g: work.id, s: 'josephus', w: workDir, b, c: ch.number, v: sec.number, t: sec.text })
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
