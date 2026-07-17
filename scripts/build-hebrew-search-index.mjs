// Build the Masoretic-Text search index that powers right-click "search this Hebrew word"
// (mirrors the Greek search-index.json + word-index). One entry per MT verse:
//   { id, bookId, chapter, verse, reference, text, strongs: [unique numeric Strong's] }
// - text:    the pointed Hebrew verse (for display + the accent-insensitive "this form" search)
// - strongs: every distinct Strong's number in the verse (for the "all forms" search)
// Sourced from public/data/mt/<osisId>_<chapter>.json (OSHB/MorphHB, CC BY 4.0), in canonical
// order. Output: public/data/hebrew-search-index.json.gz (read server-side by src/lib/search.ts).
//
// Usage:  node scripts/build-hebrew-search-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const DATA = path.join(process.cwd(), 'public', 'data')
const MT = path.join(DATA, 'mt')

// Canonical MT book order, from books.json.
const books = JSON.parse(fs.readFileSync(path.join(DATA, 'books.json'), 'utf8'))
const ORDER = (books.mt ?? []).map(b => b.osisId)
const orderOf = osis => { const i = ORDER.indexOf(osis); return i === -1 ? 999 : i }

const out = []
for (const file of fs.readdirSync(MT)) {
  if (!file.endsWith('.json')) continue
  const chap = JSON.parse(fs.readFileSync(path.join(MT, file), 'utf8'))
  for (const v of chap.verses ?? []) {
    const strongs = [...new Set(
      (v.words ?? [])
        .map(w => String(w.strongs || '').replace(/[^0-9]/g, ''))   // numeric part only
        .filter(Boolean),
    )]
    out.push({
      id: v.id,
      bookId: v.bookId,
      chapter: v.chapter,
      verse: v.verse,
      reference: v.reference,
      text: v.text,
      strongs,
    })
  }
}

out.sort((a, b) =>
  orderOf(a.bookId) - orderOf(b.bookId) || a.chapter - b.chapter || a.verse - b.verse)

const gz = zlib.gzipSync(Buffer.from(JSON.stringify(out), 'utf8'))
const outFile = path.join(DATA, 'hebrew-search-index.json.gz')
fs.writeFileSync(outFile, gz)
console.log(`Hebrew search index: ${out.length} verses -> ${path.relative(process.cwd(), outFile)} (${(gz.length / 1_048_576).toFixed(1)} MB gz)`)
