/**
 * Cross-checks our Spanish glosses against an INDEPENDENT Spanish source.
 *
 * The gloss catalogues are guarded for coverage and for staleness, and neither can tell a
 * correct gloss from a wrong one — a mistranslation fingerprints and audits exactly like a good
 * translation. This is the only check that looks at MEANING, and it does so the only way a
 * script can: by asking whether somebody else, working independently, rendered the same Greek
 * word with any of the same Spanish.
 *
 * The other source is the OpenGNT Spanish literal interlinear (E. Barrientos / GALEED 2017,
 * CC BY-SA 4.0, github.com/eliranwong/OpenGNT), aggregated per lexeme. It is used only to
 * FLAG disagreements for a human to read; nothing is copied from it, so no attribution is owed
 * on our output. Its renderings are occurrence-shaped ("cambistas", "habiendo arrojado…") where
 * ours are dictionary entries, which is exactly why a mismatch is a question and not a verdict.
 *
 * Usage: node scripts/check-glosses-against-ognt.mjs <ognt_es_by_lemma.json> [--limit N]
 */
import fs from 'node:fs'
import zlib from 'node:zlib'

/**
 * NO STOPWORD LIST, and no minimum word length. The first version of this had both, and scored
 * ἐγώ ("yo" against "yo") and ἐν ("en" against "en") as disagreements — the short function words
 * a stopword list removes are precisely the glosses of the commonest words in the language.
 *
 * Words agree when they share a 3-character prefix, which is what lets "rogar" match "rogando"
 * and "cambista" match "cambistas". Three is deliberately loose: a false agreement costs a
 * missed check, a false disagreement costs a human reading a gloss that was fine, and there are
 * nearly five thousand of these.
 */
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const words = s => fold(s).split(/[^a-z]+/).filter(Boolean)
const agree = (a, b) => a === b || (a.length >= 3 && b.length >= 3 && a.slice(0, 3) === b.slice(0, 3))
const overlaps = (a, b) => a.some(x => b.some(y => agree(x, y)))

const ogntPath = process.argv[2]
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity

const ognt = JSON.parse(fs.readFileSync(ogntPath, 'utf8'))
const lex  = JSON.parse(fs.readFileSync('public/data/lexicon-gloss/es/greek.json', 'utf8'))
const deckEs = JSON.parse(fs.readFileSync('public/data/vocab/es/greek.json', 'utf8'))
const lemmas = JSON.parse(
  zlib.gunzipSync(fs.readFileSync('public/data/lemma-index.json.gz')).toString('utf8'),
)
const freq = new Map(lemmas.map(e => [e.l.normalize('NFC'), e.f]))

// Ours, from both layers, keyed by lemma.
const ours = new Map()
for (const [k, v] of Object.entries(lex)) ours.set(k.slice('lex.gloss.'.length), v.text)
for (const [k, v] of Object.entries(deckEs)) {
  const lemma = k.slice('vocab.gloss.greek.'.length).split('~')[0]
  if (!ours.has(lemma)) ours.set(lemma, v.text)
}

const rows = []
let compared = 0, agreed = 0
for (const [lemma, mine] of ours) {
  const theirs = ognt[lemma]
  if (!theirs || theirs.length === 0) continue     // no independent reading to compare against
  compared++
  const mineWords = words(mine)
  const theirWords = theirs.map(([t]) => words(t))
  if (theirWords.some(t => overlaps(mineWords, t))) { agreed++; continue }
  rows.push({
    lemma,
    freq: freq.get(lemma) ?? 0,
    ours: mine,
    theirs: theirs.slice(0, 3).map(([t, n]) => `${t} (${n})`).join(' · '),
  })
}

rows.sort((a, b) => b.freq - a.freq)
const shown = rows.slice(0, LIMIT)

// The full list as a file, since 1,400+ lines is not something to read in a terminal.
const out = 'scripts/gloss-review.tsv'
fs.writeFileSync(out,
  'lemma\tfreq\tours\tOpenGNT\n' + rows.map(r => `${r.lemma}\t${r.freq}\t${r.ours}\t${r.theirs}`).join('\n') + '\n')

console.log(`compared      : ${compared.toLocaleString()} lemmas both sources gloss`)
console.log(`agreed        : ${agreed.toLocaleString()} (${(agreed / compared * 100).toFixed(1)}%)`)
console.log(`to review     : ${rows.length.toLocaleString()}`)
console.log(`  of those, occurring 5+ times: ${rows.filter(r => r.freq >= 5).length}`)
console.log()
console.log('lemma'.padEnd(18) + 'freq'.padStart(5) + '  ours'.padEnd(34) + '  OpenGNT (independent)')
console.log('-'.repeat(110))
for (const r of shown) {
  console.log(r.lemma.padEnd(18) + String(r.freq).padStart(5) + '  ' + r.ours.slice(0, 30).padEnd(32) + '  ' + r.theirs.slice(0, 46))
}
if (rows.length > shown.length) console.log(`… ${rows.length - shown.length} more`)
console.log()
console.log(`full list written to ${out}`)
console.log('READ IT AS QUESTIONS, NOT ERRORS. The comparison text is a hyper-literal')
console.log('interlinear with a distinctive translation philosophy — it renders σταυρός as')
console.log('"madero de ejecución", ναός as "habitación divina", βάπτισμα as "sumergimiento".')
console.log('On theological vocabulary it disagrees with any standard lexicon, ours included.')
console.log('Its value is on ORDINARY vocabulary, where a disagreement usually means one of the')
console.log('two picked the wrong sense — which is how the εὐθύς gloss was caught.')
