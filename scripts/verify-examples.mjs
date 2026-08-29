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
  // Elision is written with at least three different characters across our sources: the
  // curly quote U+2019, the modifier apostrophe U+02BC, and GREEK KORONIS U+1FBD \u2014 and the
  // koronis is IN the Greek block, so the class below would keep it while stripping the
  // others, and \u03b4\u03b9\u2019 would never match \u03b4\u03b9\u1fbd. Drop all of them before anything else.
  .replace(/[\u2019\u02bc\u1fbd'\u2018]/g, '')
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

/**
 * A reference spanning verses ("Rom 8:33-34") is a legitimate composed example — a clause
 * drawn from one verse and its answer from the next. Match those against the two verses
 * joined, so the citation is still checked rather than waved through.
 */
function spanned(r) {
  const m = /^(.*?)\s*(\d+):(\d+)\s*[-–]\s*(\d+)$/.exec(r.trim())
  if (!m) return null
  const [, book, ch, from, to] = m
  const parts = []
  for (let v = Number(from); v <= Number(to); v++) {
    const hit = verses.find(x => sameRef(`${book} ${ch}:${v}`, x.ref))
    if (!hit) return null
    parts.push(...hit.words)
  }
  return parts
}

/** Check one quoted clause against its stated reference. */
function check(file, g, r) {
  checked++
  const needle = norm(g)
  if (!needle) return
  const words = needle.split(' ').filter(Boolean)

  const span = spanned(r)
  if (span) {
    if (!inOrder(span, words)) problems.push({ file, r, g, why: 'not found across that verse range' })
    return
  }

  const hits = verses.filter(v => inOrder(v.words, words))
  if (hits.length === 0) problems.push({ file, r, g, why: 'not found in the GNT' })
  else if (!hits.some(h => sameRef(r, h.ref))) {
    problems.push({ file, r, g, why: `found in ${hits.slice(0, 3).map(h => h.ref).join(', ')}` })
  }
}

for (const f of fs.readdirSync(CHAPTERS).sort()) {
  if (!f.endsWith('.tsx')) continue
  const name = f.replace(/\.tsx$/, '')
  if (only.length && !only.some(o => name.includes(o))) continue
  const src = fs.readFileSync(path.join(CHAPTERS, f), 'utf8')
  // { g: "…", e: "…", r: "…" } — the example triples inside Cat's ex prop
  for (const m of src.matchAll(/\{\s*g:\s*"([^"]+)"\s*,\s*e:\s*"([^"]*)"\s*,\s*r:\s*"([^"]+)"\s*\}/g)) {
    check(name, m[1], m[3])
  }
}

/**
 * The quiz datasets, which matter more than the chapters: a student sits these for a grade.
 * Same shape in each — a `greek` field and a `reference` field — so one pattern covers them.
 * grammar-homework-slides.ts is the decks' own Greek, pulled out of the PowerPoints, so
 * anything wrong here is wrong in the deck a student is looking at in class.
 */
const DATASETS = [
  'src/data/conditional-examples.ts',
  'src/data/subjunctive-examples.ts',
]
for (const rel of DATASETS) {
  const name = path.basename(rel, '.ts')
  if (only.length && !only.some(o => name.includes(o))) continue
  if (!fs.existsSync(rel)) continue
  const src = fs.readFileSync(rel, 'utf8')
  // greek: '…' … reference: '…'  (single or double quoted, fields in either order)
  for (const m of src.matchAll(/greek:\s*(['"])(.*?)\1[\s\S]{0,600}?reference:\s*(['"])(.*?)\3/g)) {
    check(name, m[2], m[4])
  }
}

console.log(`checked ${checked} cited examples across the chapters and quiz datasets`)
if (!problems.length) { console.log('every one matches its reference'); process.exit(0) }
console.log(`\n${problems.length} to look at:`)
for (const p of problems) console.log(`  [${p.file}] ${p.r} — ${p.why}\n      ${p.g}`)
process.exit(1)
