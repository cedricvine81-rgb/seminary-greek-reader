/**
 * Check the lesson PowerPoints against the Greek text this app serves.
 *
 *   node scripts/check-decks.mjs ~/dev/decks            # walk every .pptx under a folder
 *   node scripts/check-decks.mjs ~/dev/decks --dump     # also print every Greek run found
 *
 * The decks and the app are two faces of the same course, and when a slide quotes a verse
 * differently from the Reader a student has both open and sees the disagreement. This finds
 * three things:
 *
 *   1. a Greek run on a slide that ALSO carries a reference, where the two do not match
 *   2. any run matching one of the places NA1904 is known to differ from NA28 (the edition a
 *      slide is most likely to have been typed from)
 *   3. slides teaching the prohibition aspect rule as a hard rule, which the app now qualifies
 *
 * A .pptx is a zip of XML; slide text lives in <a:t> runs, which is all this needs. No
 * dependency — the unzip is done by the system `unzip`, which every mac has.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const root = process.argv[2]
const DUMP = process.argv.includes('--dump')
if (!root) { console.error('usage: node scripts/check-decks.mjs <folder> [--dump]'); process.exit(2) }

/* ── the corpus ─────────────────────────────────────────────────────────── */
const norm = s => s
  .normalize('NFD')
  .replace(/[̀-ͯ͂-ͅ]/g, '')
  .replace(/[’ʼ᾽'‘]/g, '')
  // A slide supplies an implied word in brackets — ὁ νόμος [ἐστιν] ἅγιος — which is correct
  // editorial practice and must not be read as part of the quotation.
  .replace(/\[[^\]]*\]/g, ' ')
  .replace(/[^\p{Script=Greek}\s]/gu, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

const verses = []
for (const f of fs.readdirSync('public/data/gnt')) {
  if (!f.endsWith('.json')) continue
  for (const v of JSON.parse(fs.readFileSync(path.join('public/data/gnt', f), 'utf8')).verses ?? []) {
    const n = norm(v.text)
    verses.push({ ref: v.reference, words: n.split(' ').filter(Boolean) })
  }
}
const ALIAS = { jas: 'james', phlm: 'philemon', rom: 'romans', phil: 'philippians', matt: 'matthew',
  mk: 'mark', lk: 'luke', jn: 'john', cor: 'corinthians', pet: 'peter', heb: 'hebrews', rev: 'revelation' }
const squash = t => t.replace(/[\s.]/g, '').toLowerCase()
function refEq(cited, actual) {
  const c = /^(.*?)\s*(\d+):(\d+)$/.exec(cited.trim()); const a = /^(.*?)\s*(\d+):(\d+)$/.exec(actual.trim())
  if (!c || !a) return false
  if (c[2] !== a[2] || c[3] !== a[3]) return false
  let cb = squash(c[1]); const ab = squash(a[1])
  cb = ALIAS[cb] ?? cb
  return ab.startsWith(cb) || cb.startsWith(ab)
}

const inOrder = (hay, needle) => {
  let i = 0
  for (const w of hay) if (w === needle[i] && ++i === needle.length) return true
  return i === needle.length
}

/* ── places our edition differs from the one a slide was likely typed from ── */
const DIVERGENCES = [
  { at: ['Rom 5'], look: 'ειρηνην εχομεν προς τον θεον', say: 'Rom 5:1 — NA1904 prints ἔχωμεν (subjunctive), not ἔχομεν' },
  { at: ['Matt 5'], look: 'μακαριοι οι πενθουντες', say: 'this edition places οἱ πενθοῦντες at Matt 5:5, not 5:4' },
  { at: ['John 10'], look: 'γεγραπται εν τω νομω υμων', say: 'John 10:34 reads οὐκ ἔστιν γεγραμμένον here, not γέγραπται' },
  { at: ['Mark 5'], look: 'μη φοβηθης μονον πιστευε', say: 'Mark 5:36 reads μὴ φοβοῦ — a present imperative, not the aorist subjunctive' },
  { at: ['Matt 3'], look: 'ο δε ιωαννης διεκωλυεν', say: 'Matt 3:14 has no Ἰωάννης in this edition' },
  { at: ['Matt 24'], look: 'ο ουρανος και η γη παρελευσονται', say: 'Matt 24:35 is singular παρελεύσεται; the plural is Mark/Luke' },
]

/** Slides asserting the prohibition aspect rule the app now qualifies. */
const ASPECT_RULE = /(stop\s+doing|don'?t\s+start|cease\s+doing|do\s+not\s+begin)/i

/* ── read a .pptx ───────────────────────────────────────────────────────── */
function slidesOf(file) {
  const names = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' })
    .split('\n').filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]))
  return names.map(n => {
    const xml = execFileSync('unzip', ['-p', file, n], { encoding: 'utf8', maxBuffer: 64 << 20 })
    // Each <a:p> is a paragraph; join its <a:t> runs so a clause split across runs survives.
    const paras = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map(m =>
      [...m[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
        .map(t => t[1]).join('')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
        .replace(/\s+/g, ' ').trim())
      .filter(Boolean)
    return { slide: +n.match(/\d+/)[0], paras }
  })
}

// Slides cite as "Mark 13.31" at least as often as "Mark 13:31", so the separator has to
// allow a dot. Getting this wrong makes the whole misquote check silently find nothing.
const REF = /\b((?:[1-3]\s*)?[A-Z][a-z]{2,11})\.?\s*(\d+)[.:](\d+)(?:[-–](\d+))?\b/
const findings = []
let decks = 0, slides = 0, greekRuns = 0

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.pptx') && !e.name.startsWith('~$')) checkDeck(p)
  }
}

function checkDeck(file) {
  decks++
  const rel = path.relative(root, file)
  for (const { slide, paras } of slidesOf(file)) {
    slides++
    for (const para of paras) {
      const greek = norm(para)
      const words = greek.split(' ').filter(Boolean)

      if (ASPECT_RULE.test(para) && /(aorist|present)/i.test(para) && /(μή|mē|prohibit)/i.test(para)) {
        findings.push({ kind: 'aspect-rule', rel, slide, text: para.slice(0, 160) })
      }
      if (words.length < 2) continue
      greekRuns++
      if (DUMP) console.log(`  ${rel} s${slide}: ${para.slice(0, 110)}`)

      for (const d of DIVERGENCES) {
        // Only a problem when the slide cites the verse the divergence is about: the plural
        // παρελεύσονται is perfectly correct on a slide citing Mark 13:31, and wrong only on
        // one citing Matt 24:35.
        if (!greek.includes(d.look)) continue
        const r = REF.exec(para)
        const citedHere = r && d.at.some(a => `${r[1].replace(/\s/g, '')} ${r[2]}:${r[3]}`.toLowerCase().startsWith(a.toLowerCase()))
        if (!r || citedHere) {
          findings.push({ kind: 'divergence', rel, slide, text: para.slice(0, 140), why: d.say })
        }
      }

      // A run of 4+ Greek words carrying its own reference is a quotation making a claim.
      const m = REF.exec(para)
      if (m && words.length >= 4) {
        const cited = `${m[1].replace(/\.$/, '')} ${m[2]}:${m[3]}`
        if (verses.some(v => inOrder(v.words, words))) continue

        // Gather the cited verse and, when the slide cites a range, the verses it spans.
        const from = +m[3], to = m[4] ? +m[4] : from
        const span = []
        for (let v = from; v <= to; v++) {
          const hit = verses.find(x => refEq(`${m[1]} ${m[2]}:${v}`, x.ref))
          if (hit) span.push(...hit.words)
        }
        if (!span.length) continue                    // reference we cannot resolve — say nothing
        if (inOrder(span, words)) continue            // fine once the range is allowed

        // A word that is nowhere in the cited verses is a different word — a typo or a
        // variant. Words all present but out of order is an edition or ellipsis difference,
        // which is a much weaker claim, so the two are reported separately.
        const set = new Set(span)
        const absent = words.filter(w => !set.has(w))
        findings.push({
          kind: absent.length ? 'typo' : 'ordering',
          rel, slide, text: para.slice(0, 150),
          why: absent.length
            ? `${cited} — not in that text: ${absent.join(', ')}`
            : `${cited} — every word is there, but not in this order (edition or ellipsis)`,
        })
      }
    }
  }
}

walk(root)

console.log(`${decks} decks · ${slides} slides · ${greekRuns} Greek runs\n`)
const by = k => findings.filter(f => f.kind === k)
for (const [kind, label] of [
  ['divergence', 'Quotes a text our edition does not have'],
  ['typo', 'Greek on the slide that is not in the verse it cites'],
  ['ordering', 'All the words are there, but not in that order (edition or ellipsis)'],
  ['aspect-rule', 'States the prohibition aspect rule the app now qualifies'],
]) {
  const fs_ = by(kind)
  if (!fs_.length) continue
  console.log(`── ${label} (${fs_.length})`)
  for (const f of fs_) {
    console.log(`   ${f.rel} · slide ${f.slide}`)
    if (f.why) console.log(`      ${f.why}`)
    console.log(`      ${f.text}`)
  }
  console.log()
}
if (!findings.length) console.log('nothing to change')
