// Rebuild the Septuagint half of public/data/search-index.json.
//
// WHAT THIS FILE IS. src/lib/search.ts serves plain word search and reference lookup out of one
// flat verse list. It is NOT derived from public/data/lxx/ at request time — it is a baked file,
// and until now nothing in the repo rebuilt it. It had not been regenerated since April, which
// had two consequences nobody could see from the app:
//
//   1. It still held the RAHLFS text. Searching the Septuagint returned verses that no longer
//      matched what the reader showed, and — the sharper problem — it meant the CC BY-NC-SA text
//      the Swete migration existed to remove was still being shipped and served.
//   2. Nine books had never been in it at all: 1Esd, Tob, PsSol, Bar, Sus, Bel, Obad, Nah, Zeph.
//      Six of those are deuterocanonical. Searching for a word in Tobit returned nothing, and
//      nothing distinguished that from the word genuinely not occurring there.
//
// THE NEW TESTAMENT HALF IS COPIED THROUGH UNTOUCHED. Its text comes from a different pipeline
// and rebuilding it here would silently change what NT search returns, which is not this script's
// business. Only `corpus: 'LXX'` entries are replaced.
//
// Usage:  node scripts/build-search-index.mjs

import fs from 'node:fs'
import path from 'node:path'

const DATA = path.join(process.cwd(), 'public', 'data')
const OUT = path.join(DATA, 'search-index.json')

const books = JSON.parse(fs.readFileSync(path.join(DATA, 'books.json'), 'utf8'))
const meta = new Map(books.lxx.map(b => [b.osisId, b]))

const existing = JSON.parse(fs.readFileSync(OUT, 'utf8'))
const kept = existing.filter(v => v.corpus !== 'LXX')
const before = new Set(existing.filter(v => v.corpus === 'LXX').map(v => v.bookId))

// Canonical order, so results come back in reading order the way the old file did.
const lxx = []
for (const b of books.lxx) {
  const chapters = fs.readdirSync(path.join(DATA, 'lxx'))
    .filter(f => f.startsWith(`${b.osisId}_`) && f.endsWith('.json'))
    .map(f => Number(f.slice(b.osisId.length + 1, -5)))
    .filter(n => Number.isFinite(n))
    .sort((x, y) => x - y)
  for (const ch of chapters) {
    const doc = JSON.parse(fs.readFileSync(path.join(DATA, 'lxx', `${b.osisId}_${ch}.json`), 'utf8'))
    for (const v of doc.verses) {
      if (!v.text) continue
      lxx.push({
        id: v.id, bookId: v.bookId, chapter: v.chapter, verse: v.verse,
        reference: v.reference, text: v.text,
        bookName: b.name, bookAbbrev: b.abbrev, corpus: 'LXX',
      })
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify([...kept, ...lxx]))

const after = new Set(lxx.map(v => v.bookId))
const gained = [...after].filter(b => !before.has(b))
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1)
console.log(`search-index.json: ${kept.length + lxx.length} verses, ${mb} MB`)
console.log(`  kept (not LXX): ${kept.length}`)
console.log(`  LXX rebuilt   : ${lxx.length} verses across ${after.size} books (was ${before.size})`)
if (gained.length) console.log(`  now searchable : ${gained.join(', ')}`)
const missing = books.lxx.map(b => b.osisId).filter(b => !after.has(b))
if (missing.length) console.log(`  STILL MISSING  : ${missing.join(', ')}`)
