// Build a comprehensive Greek lemma index for the reader's predictive search: every lemma with
// a gloss, frequency, and the verses it appears in (any form). The New Testament comes from the
// parsing trees (public/data/phrase-tree/<book>.json), which carry a lemma+gloss for every word —
// far more complete than the vocabulary lexicon. Output: public/data/lemma-index.json.gz
//
// THE SEPTUAGINT VERSES LIVE IN A SEPARATE FIELD, `lx`. "All forms" search on the Septuagint used
// to return nothing at all: the index held only GNT verse ids, so filtering them by corpus 'LXX'
// left an empty set, and searchByLemma returned it rather than falling back. Silently — the pane
// simply said no matches, which is indistinguishable from the word not occurring.
//
// It could not have worked before now. The Rahlfs data's `lemma` field was degenerate: it held the
// inflected surface form, not a dictionary form, so there was nothing to group by. Our own Stanza
// tagging of Swete gives real lemmas, which is what makes this possible.
//
// `v` (GNT) stays exactly what it was, because two other things read it and must not change:
// suggestGreekLexemes, which offers New Testament vocabulary, and lemmaVerseIds, which picks a
// sentence for the vocab drill. Both would start returning Septuagint material if `lx` were merged
// into `v`. Frequency `f` likewise stays New Testament, with `lf` alongside it for the Septuagint.
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

// ─── The Septuagint ───────────────────────────────────────────────────────────
// Straight from the chapter files the reader serves, so a lemma found here is a lemma the
// parsing pane will show for that word.
const LXX_DIR = path.join(process.cwd(), 'public', 'data', 'lxx')
const lxxBooks = new Set(
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'books.json'), 'utf8'))
    .lxx.map(b => b.osisId))

for (const file of fs.readdirSync(LXX_DIR).filter(f => f.endsWith('.json'))) {
  // Skip data files no book entry points at (DanTh/SusTh/BelTh) — nothing can navigate to them,
  // so indexing them would only produce hits that cannot be opened.
  if (!lxxBooks.has(file.slice(0, file.lastIndexOf('_')))) continue
  const d = JSON.parse(fs.readFileSync(path.join(LXX_DIR, file), 'utf8'))
  for (const verse of d.verses) {
    for (const w of verse.words) {
      if (!w.lemma) continue
      const norm = normalize(String(w.lemma).replace(LETTERS, ''))
      if (norm.length < 2) continue
      let e = byNorm.get(norm)
      if (!e) { e = { lemmas: new Map(), glosses: new Map(), verses: new Set(), total: 0 }; byNorm.set(norm, e) }
      if (!e.lxx) { e.lxx = new Set(); e.lxxTotal = 0 }
      // Only let the Septuagint name the lexeme when the New Testament has not: its lemmas are
      // machine-generated, and the hand-tagged spelling should win wherever there is one.
      if (e.total === 0) e.lemmas.set(w.lemma, (e.lemmas.get(w.lemma) ?? 0) + 1)
      e.lxx.add(verse.id)
      e.lxxTotal++
    }
  }
}

const top = m => { let best = '', n = 0; for (const [k, c] of m) if (c > n) { best = k; n = c }; return best }
const out = Array.from(byNorm.entries())
  .map(([norm, e]) => ({
    n: norm, l: top(e.lemmas), g: top(e.glosses), f: e.total, v: Array.from(e.verses),
    ...(e.lxx?.size ? { lf: e.lxxTotal, lx: Array.from(e.lxx) } : {}),
  }))
  .sort((a, b) => b.f - a.f)

const gz = zlib.gzipSync(Buffer.from(JSON.stringify(out), 'utf8'), { level: 9 })
fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'lemma-index.json.gz'), gz)
console.log(`lemmas: ${out.length} · ${(gz.length / 1e6).toFixed(2)} MB gz`)
const withLxx = out.filter(e => e.lx)
const lxxOnly = withLxx.filter(e => e.f === 0)
console.log(`  with Septuagint verses: ${withLxx.length} (${lxxOnly.length} occur ONLY in the Septuagint)`)
console.log('sample:', JSON.stringify(out.slice(0, 3).map(x => ({ n: x.n, l: x.l, g: x.g, f: x.f, verses: x.v.length, lxxVerses: x.lx?.length ?? 0 }))))
