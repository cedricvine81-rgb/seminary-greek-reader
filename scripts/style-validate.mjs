/**
 * Validate the style index BEFORE any UI is built.
 *
 *   node scripts/style-validate.mjs
 *
 * The tool is only worth shipping if it reproduces things we already know. This runs the
 * instructor's own hunch (Tobit should sit near the synoptics, Josephus far away) plus
 * known-answer controls from the scholarship: Luke should pair with Acts, 2 Peter with Jude,
 * Hebrews should stand off from the Pauline letters, Revelation should be an outlier.
 *
 * Distance is Burrows's Delta — mean absolute difference of z-scored function-word
 * frequencies. Lower is more similar.
 */
import fs from 'node:fs'

const meta = JSON.parse(fs.readFileSync('public/data/style/meta.json', 'utf8'))
const units = JSON.parse(fs.readFileSync('public/data/style/units.json', 'utf8'))
const works = units.filter(u => u.kind === 'work')
const byName = new Map(works.map(w => [w.work, w]))

const delta = (a, b) => {
  let s = 0
  for (let i = 0; i < a.delta.length; i++) s += Math.abs(a.delta[i] - b.delta[i])
  return s / a.delta.length
}

const near = (name, n = 8, filter = () => true) => {
  const t = byName.get(name)
  if (!t) return null
  return works.filter(w => w.work !== name && filter(w))
    .map(w => ({ work: w.work, corpus: w.corpus, d: delta(t, w), n: w.n }))
    .sort((a, b) => a.d - b.d).slice(0, n)
}

const rank = (name, target) => {
  const t = byName.get(name)
  const all = works.filter(w => w.work !== name)
    .map(w => ({ work: w.work, d: delta(t, w) })).sort((a, b) => a.d - b.d)
  const i = all.findIndex(w => w.work === target)
  return { rank: i + 1, of: all.length, d: i >= 0 ? all[i].d : null }
}

console.log(`${works.length} works profiled · Delta over ${meta.deltaWords.length} function words\n`)

/* ── 1. the instructor's hunch ───────────────────────────────────────────── */
console.log('═══ THE HUNCH: what is Tobit closest to? ═══')
const tob = near('Tob', 10)
if (!tob) console.log('  Tob not found')
else for (const r of tob) console.log(`   ${r.d.toFixed(3)}  ${r.work.padEnd(34)} ${r.corpus}`)

console.log('\n   …and where do the synoptics and Josephus actually rank for Tobit?')
for (const t of ['Mark', 'Matt', 'Luke', 'John', 'josephus/antiquities', 'josephus/jewish-war', 'philo'])
  { const r = rank('Tob', t); if (r.rank) console.log(`      #${String(r.rank).padStart(3)} of ${r.of}  ${t.padEnd(24)} Δ ${r.d?.toFixed(3)}`) }

/* ── 2. known-answer controls ────────────────────────────────────────────── */
console.log('\n═══ CONTROLS: does it reproduce what we already know? ═══')
const CONTROLS = [
  ['Luke', 'Acts',   'Luke and Acts share an author — should be very close'],
  ['2Pet', 'Jude',   '2 Peter reuses Jude — should be close'],
  ['1Tim', '2Tim',   'the Pastorals should cluster'],
  ['Eph',  'Col',    'Ephesians and Colossians should be close'],
  ['Matt', 'Mark',   'synoptics should be close'],
  ['Heb',  'Rom',    'Hebrews should NOT be Paul-like — expect a poor rank'],
  ['Rev',  'John',   'Revelation is an outlier even beside John'],
]
for (const [a, b, note] of CONTROLS) {
  if (!byName.has(a) || !byName.has(b)) { console.log(`   (missing ${a} or ${b})`); continue }
  const r = rank(a, b)
  const flag = r.rank <= 5 ? 'CLOSE ' : r.rank <= 20 ? 'mid   ' : 'FAR   '
  console.log(`   ${flag} ${a} → ${b}: #${r.rank} of ${r.of}  (Δ ${r.d.toFixed(3)})   ${note}`)
}

/* ── 3. a sanity check on the corpus ends ────────────────────────────────── */
console.log('\n═══ SANITY: nearest neighbours of a few anchors ═══')
for (const anchor of ['Mark', 'josephus/antiquities', 'philo']) {
  const rs = near(anchor, 5)
  if (!rs) continue
  console.log(`   ${anchor}:`)
  for (const r of rs) console.log(`      ${r.d.toFixed(3)}  ${r.work.padEnd(32)} ${r.corpus}`)
}

/* ── 4. the "why" table, for the headline comparison ─────────────────────── */
function why(a, b, n = 12) {
  const A = byName.get(a), B = byName.get(b)
  if (!A || !B) return
  const rows = meta.features
    .map(f => ({ ...f, a: A.rates[f.key] ?? 0, b: B.rates[f.key] ?? 0 }))
    .map(r => ({ ...r, gap: Math.abs(r.a - r.b) }))
    .sort((x, y) => y.gap - x.gap).slice(0, n)
  console.log(`\n   ${a} vs ${b} — biggest feature gaps (per 1,000 words)`)
  console.log(`      ${'feature'.padEnd(34)}${a.padStart(9)}${b.padStart(11)}   `)
  for (const r of rows) {
    const warn = r.taggerSensitive ? ' ~' : '  '
    console.log(`      ${r.label.padEnd(34)}${r.a.toFixed(1).padStart(9)}${r.b.toFixed(1).padStart(11)}${warn}`)
  }
}
console.log('\n═══ WHY: the per-feature table the UI would show ═══')
why('Tob', 'Mark')
why('Tob', 'josephus/antiquities')
console.log('\n   ~ = derived from tagger categories, so comparable but not exact')
