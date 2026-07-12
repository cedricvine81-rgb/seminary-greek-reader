// Build a per-word search index for the reader's right-click "Search this word" actions:
// morphology search and Strong's-number search. Sourced from the parsing trees
// (public/data/phrase-tree/<book>.json), which carry strongs + a human-readable parsing
// string for every GNT word. Output: public/data/word-index.json.gz
//
// Shape: { [verseId]: [ [strongs, lemmaNorm, parsingLower], ... ] }
// grouped by verse (verseId stored once) — searched server-side in src/lib/search.ts.
//
// Usage:  node scripts/build-word-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const GNT = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil',
  'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet',
  '1John', '2John', '3John', 'Jude', 'Rev']

const LETTERS = /[^A-Za-zÀ-ɏͰ-῿]/g
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// verseId → [ [strongs, lemmaNorm, parsingLower], ... ]
const byVerse = {}
let wordCount = 0

for (const osis of GNT) {
  const file = path.join(process.cwd(), 'public', 'data', 'phrase-tree', `${osis}.json`)
  const d = JSON.parse(fs.readFileSync(file, 'utf8'))
  const walk = n => {
    if (n.t === 'w' && n.id) {
      const verseId = n.id.split('.').slice(0, 3).join('.')
      const strongs = n.strongs ? String(n.strongs) : ''
      const lemmaNorm = n.lemma ? normalize(String(n.lemma).replace(LETTERS, '')) : ''
      const parsing = String(n.parsing ?? '').toLowerCase().trim()
      if (!strongs && !parsing) return
      ;(byVerse[verseId] ??= []).push([strongs, lemmaNorm, parsing])
      wordCount++
    } else {
      ;(n.c ?? []).forEach(walk)
    }
  }
  for (const s of d.sentences ?? []) walk(s.tree)
}

const gz = zlib.gzipSync(Buffer.from(JSON.stringify(byVerse), 'utf8'), { level: 9 })
fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'word-index.json.gz'), gz)
console.log(`verses: ${Object.keys(byVerse).length} · words: ${wordCount} · ${(gz.length / 1e6).toFixed(2)} MB gz`)
