/**
 * Build the style-comparison index: one profile per work, and per chunk within a work.
 *
 *   node scripts/build-style-index.mjs            # writes public/data/style/
 *   node scripts/build-style-index.mjs --report   # also print the calibration report
 *
 * Reads the construct-search indexes (public/data/construct/*.json.gz), which already carry
 * [strongs, lemma, parsing] per word for 3.16M words across nine corpora.
 *
 * ── Why features are lemma-anchored wherever possible ──────────────────────────────────────
 *
 * The GNT is hand-tagged; everything else is Stanza-tagged; and the LXX index omits the POS
 * field for pronouns entirely (αὐτός is there 27,006 times, parsed "singular, …" with no
 * "pronoun"). Counting POS tags therefore measures the TAGGER as much as the text — Josephus
 * shows 106/1k adverbs against the GNT's 45, which is mostly Stanza filing particles as adverbs
 * where the hand tagging calls them conjunctions.
 *
 * So: the function-word lens (Burrows's Delta, the primary signal) keys on LEMMA, which is
 * consistent everywhere. Morphology-derived features are kept, because they are what an
 * exegete actually wants to see, but each carries a `taggerSensitive` flag and the UI must
 * show it. Features are read by SCANNING the whole parsing string for a token rather than by
 * position, so the LXX's missing POS field cannot silently shift every field left.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const SRC = 'public/data/construct'
const OUT = 'public/data/style'
const CHUNK = 5000                 // words per chunk; Antiquities is not one style
const MIN_CHUNK = 1500             // a CHUNK below this is too noisy to be worth cutting
// A whole WORK is included well below that — Jude is 460 words and a reader may legitimately
// ask what it resembles — but anything under RELIABLE carries a low-confidence flag, because
// Delta on a few hundred words is genuinely unstable and the UI must say so.
const MIN_WORK = 400
const RELIABLE = 1500

/* ── corpora ─────────────────────────────────────────────────────────────── */
const CORPORA = ['GNT', 'LXX', 'josephus', 'philo', 'apostolic-fathers',
                 'pseudepigrapha', 'eusebius', 'justin', 'greco']

const load = name =>
  JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(SRC, `${name}.json.gz`))))

/* ── morphology helpers ──────────────────────────────────────────────────── */
// Scan the whole parsing string: the LXX drops the POS field, so position is unreliable.
const hasTok = (parsing, tok) => parsing.includes(tok)

/* ── the feature set ─────────────────────────────────────────────────────────
 * Each entry: how to count it, whether it depends on tagger categories, and the Grammar
 * chapter that explains it (the UI links each row to its chapter).
 */
const RATE_FEATURES = [
  // — the ones the instructor named —
  { key: 'participle',    label: 'Participles',            chapter: 'participles',  taggerSensitive: true,
    test: w => hasTok(w[2], 'participle') },
  { key: 'infinitive',    label: 'Infinitives',            chapter: 'infinitives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'infinitive') },
  // — mood —
  { key: 'optative',      label: 'Optatives',              chapter: 'subjunctives', taggerSensitive: true,
    test: w => hasTok(w[2], 'optative') },
  { key: 'subjunctive',   label: 'Subjunctives',           chapter: 'subjunctives', taggerSensitive: true,
    test: w => hasTok(w[2], 'subjunctive') },
  { key: 'imperative',    label: 'Imperatives',            chapter: 'imperatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'imperative') },
  // — tense —
  { key: 'aorist',        label: 'Aorists',                chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'aorist') },
  { key: 'imperfect',     label: 'Imperfects',             chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'imperfect') },
  { key: 'perfect',       label: 'Perfects',               chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'perfect') },
  { key: 'future',        label: 'Futures',                chapter: 'indicatives',  taggerSensitive: true,
    test: w => hasTok(w[2], 'future') },
  // — case —
  { key: 'genitive',      label: 'Genitives',              chapter: 'nouns',        taggerSensitive: true,
    test: w => hasTok(w[2], 'genitive') },
  { key: 'dative',        label: 'Datives',                chapter: 'nouns',        taggerSensitive: true,
    test: w => hasTok(w[2], 'dative') },
  { key: 'accusative',    label: 'Accusatives',            chapter: 'nouns',        taggerSensitive: true,
    test: w => hasTok(w[2], 'accusative') },
  // — lemma-anchored: these are SAFE across corpora —
  { key: 'kai',           label: 'καί',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'και' },
  { key: 'de',            label: 'δέ',                     chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'δε' },
  { key: 'gar',           label: 'γάρ',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'γαρ' },
  { key: 'oun',           label: 'οὖν',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'ουν' },
  { key: 'literaryParticles', label: 'Literary particles (τε, μέν, δή, γε)', chapter: 'conj-adv',
    taggerSensitive: false,
    test: w => w[1] === 'τε' || w[1] === 'μεν' || w[1] === 'δη' || w[1] === 'γε' },
  { key: 'article',       label: 'Article',                chapter: 'nouns',        taggerSensitive: false,
    test: w => w[1] === 'ο' },
  { key: 'hoti',          label: 'ὅτι',                    chapter: 'conj-adv',     taggerSensitive: false,
    test: w => w[1] === 'οτι' },
  { key: 'hina',          label: 'ἵνα',                    chapter: 'subjunctives', taggerSensitive: false,
    test: w => w[1] === 'ινα' },
  { key: 'egeneto',       label: 'γίνομαι (καὶ ἐγένετο …)', chapter: 'indicatives', taggerSensitive: false,
    test: w => w[1] === 'γινομαι' },
]

/* ── multi-word constructions ────────────────────────────────────────────────
 * Approximations, and labelled as such in the UI. A genitive absolute is a genitive
 * participle with a genitive substantive beside it and no article binding them; without a
 * dependency parse that is the honest best, and it is stable enough to compare LIKE WITH LIKE
 * across corpora even where the absolute count is off.
 */
function countConstructions(words) {
  let genAbs = 0, artInf = 0, periphrastic = 0
  for (let i = 0; i < words.length; i++) {
    const p = words[i][2]
    // genitive absolute: genitive participle with a genitive neighbour within two words
    if (hasTok(p, 'participle') && hasTok(p, 'genitive')) {
      for (let j = Math.max(0, i - 2); j <= Math.min(words.length - 1, i + 2); j++) {
        if (j === i) continue
        if (hasTok(words[j][2], 'genitive') && words[j][1] !== 'ο') { genAbs++; break }
      }
    }
    // articular infinitive: the article (any case) immediately before an infinitive,
    // optionally with a preposition in front (διὰ τὸ εἶναι)
    if (hasTok(p, 'infinitive') && i > 0 && words[i - 1][1] === 'ο') artInf++
    // periphrastic: εἰμί within three words of a participle
    if (words[i][1] === 'ειμι') {
      for (let j = i + 1; j <= Math.min(words.length - 1, i + 3); j++) {
        if (hasTok(words[j][2], 'participle')) { periphrastic++; break }
      }
    }
  }
  return { genAbs, artInf, periphrastic }
}

const CONSTRUCTIONS = [
  { key: 'genAbs',       label: 'Genitive absolute',   chapter: 'participles',  taggerSensitive: true, approx: true },
  { key: 'artInf',       label: 'Articular infinitive', chapter: 'infinitives', taggerSensitive: true, approx: true },
  { key: 'periphrastic', label: 'Periphrastic (εἰμί + participle)', chapter: 'indicatives', taggerSensitive: true, approx: true },
]

/* ── profile one stretch of words ────────────────────────────────────────── */
function profile(words) {
  const n = words.length
  const rates = {}
  for (const f of RATE_FEATURES) {
    let c = 0
    for (const w of words) if (f.test(w)) c++
    rates[f.key] = (1000 * c) / n
  }
  const cons = countConstructions(words)
  for (const c of CONSTRUCTIONS) rates[c.key] = (1000 * cons[c.key]) / n

  // lemma frequencies, for Delta and for vocabulary overlap
  const lem = new Map()
  for (const w of words) lem.set(w[1], (lem.get(w[1]) ?? 0) + 1)
  return { n, rates, lem }
}

/* ── gather ──────────────────────────────────────────────────────────────── */
const units = []          // { corpus, work, book, kind:'book'|'chunk', idx, profile }
const corpusTotals = new Map()

for (const corpus of CORPORA) {
  const file = path.join(SRC, `${corpus}.json.gz`)
  if (!fs.existsSync(file)) { console.error(`  missing ${corpus}`); continue }
  const data = load(corpus)
  let wordsInCorpus = 0

  // Group books into WORKS. "josephus/antiquities/3" → work "josephus/antiquities".
  const byWork = new Map()
  for (const [bookKey, v] of Object.entries(data)) {
    const parts = bookKey.split('/')
    const work = parts.length > 1 ? parts.slice(0, -1).join('/') : bookKey
    if (!byWork.has(work)) byWork.set(work, [])
    // A loop, not push(...spread): a spread of 100k+ words blows the call stack.
    const bucket = byWork.get(work)
    for (const word of v.w) bucket.push(word)
    wordsInCorpus += v.w.length
  }
  corpusTotals.set(corpus, wordsInCorpus)

  for (const [work, words] of byWork) {
    if (words.length < MIN_WORK) continue
    units.push({ corpus, work, kind: 'work', idx: 0, ...profile(words) })
    for (let i = 0, k = 0; i + MIN_CHUNK <= words.length; i += CHUNK, k++) {
      const slice = words.slice(i, i + CHUNK)
      if (slice.length < MIN_CHUNK) break
      units.push({ corpus, work, kind: 'chunk', idx: k, ...profile(slice) })
    }
  }
}

console.error(`profiled ${units.length} units from ${CORPORA.length} corpora`)
for (const [c, n] of corpusTotals) console.error(`   ${c.padEnd(20)} ${n.toLocaleString()} words`)

/* ── the Delta word list: most frequent lemmas across everything ─────────── */
const overall = new Map()
for (const u of units) {
  if (u.kind !== 'work') continue
  for (const [l, c] of u.lem) overall.set(l, (overall.get(l) ?? 0) + c)
}
const DELTA_WORDS = [...overall.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 150)
  .map(([l]) => l)

// z-scores across works, per Burrows
const DELTA_SET = new Set(DELTA_WORDS)
const workUnits = units.filter(u => u.kind === 'work')
const freqOf = (u, l) => 1000 * ((u.lem.get(l) ?? 0) / u.n)
const mu = {}, sd = {}
for (const l of DELTA_WORDS) {
  const xs = workUnits.map(u => freqOf(u, l))
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  mu[l] = m
  sd[l] = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1e-9
}
for (const u of units) {
  u.delta = DELTA_WORDS.map(l => (freqOf(u, l) - mu[l]) / sd[l])
  // content vocabulary: drop the function words, keep a capped profile for overlap
  // Content vocabulary rides only on whole works, and is split into its own file: it is the
  // bulk of the payload and the third lens does not need it until the reader asks for it.
  u.content = u.kind === 'work'
    ? [...u.lem.entries()]
        .filter(([l]) => !DELTA_SET.has(l))
        .sort((a, b) => b[1] - a[1]).slice(0, 200)
        .map(([l, c]) => [l, +(1000 * c / u.n).toFixed(2)])
    : null
}

/* ── write ───────────────────────────────────────────────────────────────── */
fs.mkdirSync(OUT, { recursive: true })
const meta = {
  built: 'see git',
  chunkWords: CHUNK,
  minWords: MIN_CHUNK,
  deltaWords: DELTA_WORDS,
  features: [...RATE_FEATURES, ...CONSTRUCTIONS].map(f => ({
    key: f.key, label: f.label, chapter: f.chapter,
    taggerSensitive: !!f.taggerSensitive, approx: !!f.approx,
  })),
}
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta))
fs.writeFileSync(path.join(OUT, 'units.json'), JSON.stringify(
  units.map(u => ({
    corpus: u.corpus, work: u.work, kind: u.kind, idx: u.idx, n: u.n,
    reliable: u.n >= RELIABLE,
    rates: Object.fromEntries(Object.entries(u.rates).map(([k, v]) => [k, +v.toFixed(2)])),
    delta: u.delta.map(x => +x.toFixed(2)),
  })),
))
fs.writeFileSync(path.join(OUT, 'vocab.json'), JSON.stringify(
  Object.fromEntries(units.filter(u => u.kind === 'work').map(u => [u.work, u.content])),
))
const kb = f => Math.round(fs.statSync(path.join(OUT, f)).size / 1024)
console.error(`\nwrote ${OUT}/  units.json ${kb('units.json')}KB · vocab.json ${kb('vocab.json')}KB · meta.json ${kb('meta.json')}KB`)
