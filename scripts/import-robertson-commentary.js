#!/usr/bin/env node
/**
 * Build verse-keyed commentary JSON for A.T. Robertson's "Word Pictures in the New
 * Testament" (public domain) from the CCEL ThML edition.
 *
 * Source: CCEL ThML (https://ccel.org/ccel/r/robertson_at/word.xml). Each verse's
 * commentary is marked by <scripCom type="Commentary" osisRef="Bible:Book.C.V" />
 * and runs to the next such marker (capped at the chapter's </div2> so chapter/book
 * headings don't bleed in).
 *
 * Output: public/data/commentary/robertson/<osisId>.json  { "<ch>:<v>": "<html>" }
 *         public/data/commentary/index.json                (registry of commentaries)
 *
 * Usage: node scripts/import-robertson-commentary.js [/path/to/word.xml]
 */
const fs = require('fs')
const path = require('path')

const SRC = process.argv[2] || '/tmp/rwp.xml'
const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'commentary')
const ROBERTSON_DIR = path.join(OUT_DIR, 'robertson')

// NT OSIS codes (match the app's osisIds in public/data/books.json gnt list).
const NT = new Set(['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col',
  '1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'])

// Reduce a raw ThML slice to a small whitelist of safe formatting tags + clean text.
function clean(raw, refLabel) {
  let t = raw
  t = t.replace(/<scripRef\b[^>]*>([\s\S]*?)<\/scripRef>/g, '$1')   // keep ref text
  t = t.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, '$1')                 // drop anchors, keep text
  t = t.replace(/<br\s*\/?>/g, ' ')
  t = t.replace(/<(?!\/?(?:p|b|i|em|strong)\b)[^>]*>/g, '')         // drop every non-whitelisted tag
  t = t.replace(/<(p|b|i|em|strong)\b[^>]*>/gi, (_m, tag) => `<${tag.toLowerCase()}>`) // strip attrs
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/<(b|i|em|strong)>\s+/g, '<$1>').replace(/\s+<\/(b|i|em|strong)>/g, '</$1>') // trim inside emphasis
  // Drop a leading paragraph that is just the verse reference (CCEL repeats it).
  t = t.replace(/^\s*<p>\s*(?:[1-3] )?[A-Za-z]+\.? \d+:\d+\s*<\/p>/, '')
  t = t.replace(/<p>\s*<\/p>/g, '').trim()
  return t
}

function main() {
  const xml = fs.readFileSync(SRC, 'utf8')
  const re = /<scripCom\b[^>]*type="Commentary"[^>]*osisRef="Bible:([A-Za-z0-9]+)\.(\d+)\.(\d+)"[^>]*\/>/g
  const marks = []
  let m
  while ((m = re.exec(xml)) !== null) marks.push({ book: m[1], ch: +m[2], v: +m[3], end: re.lastIndex })

  const byBook = {}
  let kept = 0, skipped = 0
  for (let i = 0; i < marks.length; i++) {
    const cur = marks[i]
    if (!NT.has(cur.book)) { skipped++; continue }
    const nextStart = i + 1 < marks.length ? xml.indexOf('<scripCom', cur.end) : xml.length
    const chapEnd = xml.indexOf('</div2>', cur.end)
    let endPos = nextStart === -1 ? xml.length : nextStart
    if (chapEnd !== -1 && chapEnd < endPos) endPos = chapEnd
    const html = clean(xml.slice(cur.end, endPos), `${cur.book} ${cur.ch}:${cur.v}`)
    if (!html) { skipped++; continue }
    ;(byBook[cur.book] ??= {})[`${cur.ch}:${cur.v}`] = html
    kept++
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(ROBERTSON_DIR, { recursive: true })
  for (const [book, verses] of Object.entries(byBook)) {
    fs.writeFileSync(path.join(ROBERTSON_DIR, `${book}.json`), JSON.stringify(verses))
  }
  // Registry of available commentaries (extensible).
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({
    commentaries: [{
      id: 'robertson',
      name: "Robertson — Word Pictures in the NT",
      author: 'A.T. Robertson',
      attribution: "A.T. Robertson, Word Pictures in the New Testament (1930–1933), public domain. Source: Christian Classics Ethereal Library (ccel.org).",
      books: Object.keys(byBook).sort(),
    }],
  }, null, 2))

  const totalSize = fs.readdirSync(ROBERTSON_DIR).reduce((n, f) => n + fs.statSync(path.join(ROBERTSON_DIR, f)).size, 0)
  console.log(`Robertson: ${kept} verses across ${Object.keys(byBook).length} books (${skipped} skipped). ~${(totalSize / 1024 / 1024).toFixed(1)} MB`)
  console.log('John 1:1 →', (byBook.John?.['1:1'] || '').slice(0, 160))
}
main()
