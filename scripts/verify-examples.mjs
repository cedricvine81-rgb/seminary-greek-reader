/**
 * Check the Greek examples cited in the grammar chapters against our own GNT text.
 *
 *   node scripts/verify-examples.mjs                     # every <Cat ex={…}> in the chapters
 *   node scripts/verify-examples.mjs nouns participles   # only these chapters
 *
 * A grammar page that misquotes its proof text is worse than one that has none, and the
 * citations here are hand-written. This finds the verse that actually contains each quoted
 * clause and reports any whose reference does not match — or that appear nowhere at all.
 *
 * Matching ignores accents, breathings and punctuation: the chapters quote from editions and
 * the point is the wording, not the diacritics. It also allows ELISION — a grammar legitimately
 * quotes "…πᾶς ὁ πιστεύων εἰς αὐτὸν ἔχῃ ζωὴν αἰώνιον" for a verse that reads "…εἰς αὐτὸν μὴ
 * ἀπόληται ἀλλ' ἔχῃ ζωὴν αἰώνιον" — so the test is that the quoted WORDS occur in the verse in
 * order, not that they are contiguous. Wrong wording, wrong order and wrong reference all still
 * fail; only the ellipsis passes.
 */
import fs from 'node:fs'
import path from 'node:path'

const GNT = 'public/data/gnt'
const CHAPTERS = 'src/components/morphology/chapters'

/** Strip accents/breathings and punctuation so quotations compare on letters alone. */
const norm = s => s
  .normalize('NFD')
  .replace(/[\u0300-\u036f\u0342-\u0345]/g, '')
  .replace(/[^\p{Script=Greek}\s]/gu, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

// ── load the corpus once, as one normalised string per verse ──
const verses = []
for (const f of fs.readdirSync(GNT)) {
  if (!f.endsWith('.json')) continue
  const d = JSON.parse(fs.readFileSync(path.join(GNT, f), 'utf8'))
  for (const v of d.verses ?? []) {
    const n = norm(v.text)
    verses.push({ ref: v.reference, norm: n, words: n.split(' ').filter(Boolean) })
  }
}
if (verses.length < 7000) { console.error(`only ${verses.length} verses loaded`); process.exit(2) }

/**
 * Reference as the chapters write it ("Matt 5:14", "Jas 4:8", "Phlm 21") vs as the data does
 * ("Matthew 5:14", "James 4:8", "Philemon 1:21"). Two wrinkles: abbreviations that are not a
 * prefix of the full name, and the one-chapter letters, which are cited by verse alone.
 */
const ALIAS = {
  jas: 'james', phlm: 'philemon', philem: 'philemon', phm: 'philemon',
  rev: 'revelation', apoc: 'revelation', tit: 'titus',
}
const ONE_CHAPTER = new Set(['philemon', 'jude', '2john', '3john'])
const squash = s => s.replace(/[\s.]/g, '').toLowerCase()

const sameRef = (cited, actual) => {
  const cm = /^(.*?)\s*(\d+)(?::(\d+))?$/.exec(cited.trim())
  const am = /^(.*?)\s*(\d+)(?::(\d+))?$/.exec(actual.trim())
  if (!cm || !am) return false
  let cb = squash(cm[1]); let ab = squash(am[1])
  cb = ALIAS[cb] ?? cb
  ab = ALIAS[ab] ?? ab
  if (!(ab.startsWith(cb) || cb.startsWith(ab))) return false
  // "Phlm 21" means verse 21 of the single chapter, which the data calls "Philemon 1:21".
  if (cm[3] === undefined && ONE_CHAPTER.has(ab)) return am[2] === '1' && am[3] === cm[2]
  return cm[2] === am[2] && cm[3] === am[3]
}

/** Do `needle`'s words all appear in `hay`, in order? (Gaps allowed — see elision, above.) */
function inOrder(hay, needle) {
  let i = 0
  for (const w of hay) if (w === needle[i] && ++i === needle.length) return true
  return i === needle.length
}

const only = process.argv.slice(2)
let checked = 0
const problems = []

for (const f of fs.readdirSync(CHAPTERS).sort()) {
  if (!f.endsWith('.tsx')) continue
  const name = f.replace(/\.tsx$/, '')
  if (only.length && !only.some(o => name.includes(o))) continue
  const src = fs.readFileSync(path.join(CHAPTERS, f), 'utf8')
  // { g: "…", e: "…", r: "…" } — the example triples inside Cat's ex prop
  for (const m of src.matchAll(/\{\s*g:\s*"([^"]+)"\s*,\s*e:\s*"([^"]*)"\s*,\s*r:\s*"([^"]+)"\s*\}/g)) {
    const [, g, , r] = m
    checked++
    const needle = norm(g)
    if (!needle) continue
    const words = needle.split(' ').filter(Boolean)
    const hits = verses.filter(v => inOrder(v.words, words))
    if (hits.length === 0) problems.push({ file: name, r, g, why: 'not found in the GNT' })
    else if (!hits.some(h => sameRef(r, h.ref))) {
      problems.push({ file: name, r, g, why: `found in ${hits.slice(0, 3).map(h => h.ref).join(', ')}` })
    }
  }
}

console.log(`checked ${checked} cited examples across the chapters`)
if (!problems.length) { console.log('every one matches its reference'); process.exit(0) }
console.log(`\n${problems.length} to look at:`)
for (const p of problems) console.log(`  [${p.file}] ${p.r} — ${p.why}\n      ${p.g}`)
process.exit(1)
