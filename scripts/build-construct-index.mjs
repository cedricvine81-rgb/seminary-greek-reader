// Build the flat token index for Construct search (two/three words near each other).
// Source: the parsing trees (public/data/phrase-tree/<book>.json), the same gold GNT
// tagging that feeds build-word-index.mjs. Output: public/data/construct-index.json.gz
//
// Why a SECOND index rather than reusing word-index.json.gz:
//   1. word-index is grouped BY VERSE, so "within 4 words" could never cross a verse
//      boundary. Proximity needs one flat token stream per book.
//   2. The tree walk is NOT surface order — ~10% of GNT tokens come out transposed
//      because the trees carry discontinuous constituents (e.g. 1Pet 4:1-2). Harmless
//      for word-index (an AND-of-features test per word ignores order), fatal for a
//      distance test. Here every token is sorted by its id: chapter, verse, word number.
//   3. Leaving word-index.json.gz untouched keeps the shipped morphology / Strong's
//      searches in src/lib/search.ts exactly as they are.
//
// Shape:
//   { version: 2, books: { <osisId>: {
//       w: [ [strongs, lemmaNorm, parsingLower], ... ],   // flat, canonical surface order
//       v: [ [chapter, verse, startIndex], ... ]          // sorted; a verse owns w[start .. nextStart)
//     } } }
//
// Usage:  node scripts/build-construct-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const GNT = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil',
  'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet',
  '1John', '2John', '3John', 'Jude', 'Rev']

const LETTERS = /[^A-Za-zÀ-ɏͰ-῿]/g
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const books = {}
let wordCount = 0
// normalized lemma → { pos: count } — collapsed below into the DOMINANT part of speech per
// lemma, so Construct search can derive a word's part of speech from the word itself and show
// only the categories that word can take. Output: public/data/lemma-pos.json
const lemmaPosCounts = {}

for (const osis of GNT) {
  const file = path.join(process.cwd(), 'public', 'data', 'phrase-tree', `${osis}.json`)
  const d = JSON.parse(fs.readFileSync(file, 'utf8'))

  // Collect every tagged word with its id coordinates, then sort — the walk order can't be
  // trusted (see header note 2).
  const raw = []
  const walk = n => {
    if (n.t === 'w' && n.id) {
      const p = String(n.id).split('.')            // <book>.<chapter>.<verse>.<wordNum>
      const chapter = Number(p[1]), verse = Number(p[2]), num = Number(p[3])
      if (!Number.isFinite(chapter) || !Number.isFinite(verse) || !Number.isFinite(num)) return
      const strongs = n.strongs ? String(n.strongs) : ''
      const lemmaNorm = n.lemma ? normalize(String(n.lemma).replace(LETTERS, '')) : ''
      const parsing = String(n.parsing ?? '').toLowerCase().trim()
      if (!strongs && !parsing) return
      raw.push({ chapter, verse, num, row: [strongs, lemmaNorm, parsing] })
      // First parsing token is the part of speech ('verb, aorist, active, …').
      const pos = parsing.split(',')[0].trim()
      if (lemmaNorm && pos) {
        const counts = (lemmaPosCounts[lemmaNorm] ??= {})
        counts[pos] = (counts[pos] ?? 0) + 1
      }
    } else {
      ;(n.c ?? []).forEach(walk)
    }
  }
  for (const s of d.sentences ?? []) walk(s.tree)
  raw.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse || a.num - b.num)

  // Flatten, recording where each verse starts in the token stream.
  const w = []
  const v = []
  let curCh = -1, curV = -1
  for (const t of raw) {
    if (t.chapter !== curCh || t.verse !== curV) {
      v.push([t.chapter, t.verse, w.length])
      curCh = t.chapter; curV = t.verse
    }
    w.push(t.row)
  }
  books[osis] = { w, v }
  wordCount += w.length
}

const json = JSON.stringify({ version: 2, books })
const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 })
fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'construct-index.json.gz'), gz)

const verseCount = Object.values(books).reduce((n, b) => n + b.v.length, 0)
console.log(`books: ${Object.keys(books).length} · verses: ${verseCount} · words: ${wordCount} · ${(gz.length / 1e6).toFixed(2)} MB gz (${(json.length / 1e6).toFixed(1)} MB raw)`)

// ─── lemma → dominant part of speech ──────────────────────────────────────────
// Keep only the commonest tagging per lemma. Genuinely dual-class words exist (e.g. adjectives
// used substantivally), but the dominant tag is what makes the form dropdowns useful, and the
// user can always override the part of speech by hand.
const lemmaPos = {}
let ambiguous = 0
for (const lemma in lemmaPosCounts) {
  const counts = lemmaPosCounts[lemma]
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  lemmaPos[lemma] = ranked[0][0]
  // "Ambiguous" = the runner-up is at least a third as common as the winner.
  if (ranked.length > 1 && ranked[1][1] * 3 >= ranked[0][1]) ambiguous++
}
const posFile = path.join(process.cwd(), 'public', 'data', 'lemma-pos.json')
fs.writeFileSync(posFile, JSON.stringify(lemmaPos))
console.log(`lemma→pos: ${Object.keys(lemmaPos).length} lemmas · ${ambiguous} with a close runner-up · ${(fs.statSync(posFile).size / 1024).toFixed(0)} KB`)
