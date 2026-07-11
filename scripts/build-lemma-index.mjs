// Build a comprehensive Greek lemma index for the reader's predictive search: every GNT
// lemma with a gloss, frequency, and the verses it appears in (any form). Sourced from the
// parsing trees (public/data/phrase-tree/<book>.json), which carry a lemma+gloss for every
// word — far more complete than the vocabulary lexicon. Output: public/data/lemma-index.json.gz
//
// Usage:  node scripts/build-lemma-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const GNT = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil',
  'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet',
  '1John', '2John', '3John', 'Jude', 'Rev']

const LETTERS = /[^A-Za-zÀ-ɏͰ-῿]/g
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// norm → { lemmas: Map<lemma,count>, glosses: Map<gloss,count>, verses: Set<verseId>, total }
const byNorm = new Map()

for (const osis of GNT) {
  const file = path.join(process.cwd(), 'public', 'data', 'phrase-tree', `${osis}.json`)
  const d = JSON.parse(fs.readFileSync(file, 'utf8'))
  const walk = n => {
    if (n.t === 'w' && n.id && n.lemma) {
      const verseId = n.id.split('.').slice(0, 3).join('.')
      const norm = normalize(String(n.lemma).replace(LETTERS, ''))
      if (norm.length < 2) return
      let e = byNorm.get(norm)
      if (!e) { e = { lemmas: new Map(), glosses: new Map(), verses: new Set(), total: 0 }; byNorm.set(norm, e) }
      e.lemmas.set(n.lemma, (e.lemmas.get(n.lemma) ?? 0) + 1)
      e.total++
      e.verses.add(verseId)
      const g = String(n.gloss ?? '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()
      if (g) e.glosses.set(g, (e.glosses.get(g) ?? 0) + 1)
    } else {
      (n.c ?? []).forEach(walk)
    }
  }
  for (const s of d.sentences ?? []) walk(s.tree)
}

const top = m => { let best = '', n = 0; for (const [k, c] of m) if (c > n) { best = k; n = c }; return best }
const out = Array.from(byNorm.entries())
  .map(([norm, e]) => ({ n: norm, l: top(e.lemmas), g: top(e.glosses), f: e.total, v: Array.from(e.verses) }))
  .sort((a, b) => b.f - a.f)

const gz = zlib.gzipSync(Buffer.from(JSON.stringify(out), 'utf8'), { level: 9 })
fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'lemma-index.json.gz'), gz)
console.log(`lemmas: ${out.length} · ${(gz.length / 1e6).toFixed(2)} MB gz`)
console.log('sample:', JSON.stringify(out.slice(0, 3).map(x => ({ n: x.n, l: x.l, g: x.g, f: x.f, verses: x.v.length }))))
