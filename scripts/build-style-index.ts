/**
 * Build the style-comparison index: one profile per work, and per chunk within a work.
 *
 *   npm run build:style
 *
 * Reads the construct-search indexes (public/data/construct/*.json.gz), which already carry
 * [strongs, lemma, parsing] per word for 3.16M words across nine corpora.
 *
 * The FEATURE DEFINITIONS live in src/lib/style-features.ts, not here, because the passage
 * profiler (src/lib/style-passage.ts) has to count the same things the same way — see the note
 * at the head of that module. This script is the gathering and the normalization; the counting
 * is shared.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import {
  CONSTRUCTIONS, DELTA_EXCLUDE, FEATURES, LEMMA_CANON, RATE_FEATURES, contentVocab,
  profileWords, type Profile, type Word,
} from '../src/lib/style-features'

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

/**
 * Corpora whose books a reader can slice into a passage. Both are versified and both are
 * indexed per book, so a chapter range is a plain slice of the token stream; the prose
 * corpora are keyed by section rather than chapter and are not offered.
 */
const PASSAGE_CORPORA = new Set(['GNT', 'LXX'])

interface BookIndex { w: Word[]; v: [number, number, number, (number | undefined)?][] }
const load = (name: string): Record<string, BookIndex> =>
  JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(SRC, `${name}.json.gz`))).toString('utf8'))

/**
 * Human names. Construct search already ships a label per BOOK plus a `group` naming the work
 * it belongs to ("Josephus, Against Apion"), which is exactly the level this tool compares at,
 * so the names come free rather than being re-invented here.
 */
const WORKS_META: Record<string, { id: string; label: string; group?: string }[]> =
  JSON.parse(fs.readFileSync(path.join(SRC, 'works.json'), 'utf8'))
// Keyed BY CORPUS, not by id alone: the Hebrew MT registry reuses the OSIS ids and labels them
// with bare abbreviations ("Gen" → "Gen"), so a flat map silently renamed 34 Septuagint books
// after whichever registry was read last.
const LABELS = new Map<string, string>()
const labelKey = (corpus: string, id: string) => `${corpus}|${id}`
for (const [corpus, entries] of Object.entries(WORKS_META)) {
  for (const e of entries) {
    // A single-segment id IS a book ("Tob" → "Tobit"), and there `group` is the corpus name
    // ("Septuagint"), which would label every LXX book identically. Only multi-segment ids —
    // the library works — take their group, which is the work the books belong to.
    LABELS.set(labelKey(corpus, e.id), e.id.includes('/') ? (e.group || e.label) : e.label)
  }
}

/**
 * A work assembled from several books is labelled by its books, so the raw name carries the
 * first book's number ("Eusebius, Ecclesiastical History (Book 1)"). Strip the book marker,
 * but only when every constituent agrees once stripped — otherwise the label is genuinely
 * per-book and needs a hand-written name.
 */
const GROUP_LABEL: Record<string, string> = {
  'pseudepigrapha/testaments': 'Testaments of the Twelve Patriarchs',
}
const stripBook = (s: string) =>
  s.replace(/\s*\((?:Book)\s+\d+\)$/, '').replace(/\s+(?:\d+|[IVX]+)$/, '')
const groupLabel = (work: string, labels: string[]) => {
  if (GROUP_LABEL[work]) return GROUP_LABEL[work]
  if (labels.length < 2) return labels[0] ?? work
  const stripped = Array.from(new Set(labels.map(stripBook)))
  return stripped.length === 1 ? stripped[0] : labels[0]
}

/* ── gather ──────────────────────────────────────────────────────────────── */
interface Unit extends Profile {
  corpus: string
  work: string
  kind: 'work' | 'chunk'
  idx: number
  delta?: number[]
  content?: [string, number][] | null
}
const WORK_LABEL = new Map<string, string>()
const units: Unit[] = []
const corpusTotals = new Map<string, number>()
/** corpus → book id → { label, chapters: [chapterNumber, words][] } — the passage manifest. */
const passageBooks: Record<string, { id: string; label: string; work: string; ch: number[][] }[]> = {}

for (const corpus of CORPORA) {
  const file = path.join(SRC, `${corpus}.json.gz`)
  if (!fs.existsSync(file)) { console.error(`  missing ${corpus}`); continue }
  const data = load(corpus)
  let wordsInCorpus = 0

  // Group books into WORKS. This is fiddlier than it looks and getting it wrong is silent:
  // stripping the last segment unconditionally collapsed all 394 Greco-Roman keys into one
  // "greco" work — Plato and Aristotle and Plutarch averaged into a single 3.6M-word blur,
  // which is worse than useless for a tool whose whole job is telling works apart.
  //
  //   josephus/antiquities/3          → josephus/antiquities   (three segments: drop the book)
  //   pseudepigrapha/testaments/asher → pseudepigrapha/testaments
  //   greco/apollodorus-library-1     → greco/apollodorus-library   (trailing -N is a book)
  //   greco/aristotle-nicomachean-ethics → itself, a work in its own right
  //   Matt                            → itself
  const workOf = (key: string) => {
    const parts = key.split('/')
    if (parts.length >= 3) return parts.slice(0, -1).join('/')
    return key.replace(/-\d+$/, '')
  }
  const byWork = new Map<string, Word[]>()
  const bookLabels = new Map<string, string[]>()
  for (const [bookKey, v] of Object.entries(data)) {
    const work = workOf(bookKey)
    if (!byWork.has(work)) byWork.set(work, [])
    if (!bookLabels.has(work)) bookLabels.set(work, [])
    bookLabels.get(work)!.push(LABELS.get(labelKey(corpus, bookKey)) ?? bookKey)
    // A loop, not push(...spread): a spread of 100k+ words blows the call stack.
    const bucket = byWork.get(work)!
    for (const word of v.w) bucket.push(word)
    wordsInCorpus += v.w.length

    // The passage manifest: how many words each chapter holds, so the picker can show the
    // size of a selection before the reader asks the server to profile it.
    if (PASSAGE_CORPORA.has(corpus)) {
      const perChapter = new Map<number, number>()
      for (let i = 0; i < v.v.length; i++) {
        const [ch, , start] = v.v[i]
        const end = i + 1 < v.v.length ? v.v[i + 1][2] : v.w.length
        perChapter.set(ch, (perChapter.get(ch) ?? 0) + (end - start))
      }
      ;(passageBooks[corpus] ??= []).push({
        id: bookKey,
        label: LABELS.get(labelKey(corpus, bookKey)) ?? bookKey,
        work,
        ch: Array.from(perChapter.entries()).sort((a, b) => a[0] - b[0]),
      })
    }
  }
  corpusTotals.set(corpus, wordsInCorpus)
  bookLabels.forEach((labels, work) => WORK_LABEL.set(work, groupLabel(work, labels)))

  byWork.forEach((words, work) => {
    if (words.length < MIN_WORK) return
    units.push({ corpus, work, kind: 'work', idx: 0, ...profileWords(words) })
    for (let i = 0, k = 0; i + MIN_CHUNK <= words.length; i += CHUNK, k++) {
      const slice = words.slice(i, i + CHUNK)
      if (slice.length < MIN_CHUNK) break
      units.push({ corpus, work, kind: 'chunk', idx: k, ...profileWords(slice) })
    }
  })
}

console.error(`profiled ${units.length} units from ${CORPORA.length} corpora`)
corpusTotals.forEach((n, c) => console.error(`   ${c.padEnd(20)} ${n.toLocaleString()} words`))

/* ── the Delta word list: most frequent lemmas across everything ─────────── */
const overall = new Map<string, number>()
for (const u of units) {
  if (u.kind !== 'work') continue
  u.lem.forEach((c, l) => overall.set(l, (overall.get(l) ?? 0) + c))
}
const DELTA_WORDS = Array.from(overall.entries())
  // A lemma that measures the tagger and not the text is dropped before the list is cut, not
  // after — see DELTA_EXCLUDE for what each of them was doing to the numbers.
  .filter(([l]) => !DELTA_EXCLUDE.has(l))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 150)
  .map(([l]) => l)

// z-scores across works, per Burrows. mu and sd are WRITTEN OUT as well as applied: an ad-hoc
// passage has to be scored against the same distribution or its distances mean nothing.
const DELTA_SET = new Set(DELTA_WORDS)
const workUnits = units.filter(u => u.kind === 'work')
const freqOf = (u: Unit, l: string) => 1000 * ((u.lem.get(l) ?? 0) / u.n)
const mu: Record<string, number> = {}, sd: Record<string, number> = {}
for (const l of DELTA_WORDS) {
  const xs = workUnits.map(u => freqOf(u, l))
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  mu[l] = m
  sd[l] = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1e-9
}
for (const u of units) {
  u.delta = DELTA_WORDS.map(l => (freqOf(u, l) - mu[l]) / sd[l])
  // Content vocabulary rides only on whole works, and is split into its own file: it is the
  // bulk of the payload and the third lens does not need it until the reader asks for it.
  u.content = u.kind === 'work' ? contentVocab(u, DELTA_SET) : null
}

/* ── readable labels for the Delta words ─────────────────────────────────────
 * The index stores lemmas normalized — unaccented, lowercased — because that is what makes
 * them comparable across nine differently-produced corpora. But "και / δε / μεν" is not how a
 * Greek page should read, and the function-word table is meant to be read by students, so the
 * accented form and a short gloss are resolved here from the lexicon that Construct search
 * already ships. The New Testament's table is preferred and the Septuagint's fills the gaps.
 */
interface LemmaEntry { d?: string; g?: string }
const lemmaTable = (stem: string): Record<string, LemmaEntry> => {
  try {
    return JSON.parse(fs.readFileSync(path.join('public/data', `${stem}.json`), 'utf8'))
  } catch { return {} }
}
const GNT_LEMMAS = lemmaTable('lemma-forms-gnt')
const LXX_LEMMAS = lemmaTable('lemma-forms-lxx')
// Glosses run to a full dictionary sense ("a weak adversative particle…"); the table has room
// for a hint, not a definition, so keep the first sense and cap it. Three cleanups, because a
// mangled gloss beside a Greek word reads as a bug rather than as a hint: the lexicon's "(a)"
// / "(b)" sense enumerators are dropped, the cap falls on a word boundary, and a fragment left
// holding an unclosed bracket is dropped entirely — λέγω's stored gloss is already truncated
// to "(denoting speech in…" at source, and half of that is worse than none.
const shortGloss = (g: string) => {
  let out = g.replace(/^\((?:[a-z]|\d+)\)\s*/i, '').split(/[;,]|…/)[0].trim()
  if (out.length > 34) out = `${out.slice(0, 34).replace(/\s+\S*$/, '')}…`
  const opens = (out.match(/\(/g) ?? []).length
  const closes = (out.match(/\)/g) ?? []).length
  return opens === closes ? out : ''
}
// The lexicon is keyed by the corpus's own lemma, so a canonicalized word has to be looked up
// under the variants it absorbed as well: οὕτως is filed under οὕτω in both biblical lexicons.
const VARIANTS_OF: Record<string, string[]> = {}
for (const [from, to] of Object.entries(LEMMA_CANON)) (VARIANTS_OF[to] ??= []).push(from)
const deltaLabels: Record<string, { d: string; g: string }> = {}
for (const l of DELTA_WORDS) {
  const keys = [l, ...(VARIANTS_OF[l] ?? [])]
  let e: LemmaEntry = {}
  for (const k of keys) {
    const hit = GNT_LEMMAS[k] ?? LXX_LEMMAS[k]
    if (hit?.d) { e = hit; break }
  }
  deltaLabels[l] = { d: e.d || l, g: e.g ? shortGloss(e.g) : '' }
}
const unresolved = DELTA_WORDS.filter(l => deltaLabels[l].d === l)
if (unresolved.length) {
  console.error(`   ${unresolved.length} function words without an accented form: ${unresolved.join(' ')}`)
}

/* ── per-feature spread across whole works ───────────────────────────────────
 * The syntax lens and the "why" table both scale a gap by the feature's own spread. Computing
 * it in the browser from the loaded units gave the same answer, but a passage is scored
 * server-side, so the scale has to be a published constant rather than a derived one.
 */
const spread: Record<string, number> = {}
// The library's own average rate for each feature, published alongside the spread. Without it
// a reader cannot tell whether "44.3 participles" is a lot: the case that two texts SHARE a
// habit needs the norm they are both departing from.
const center: Record<string, number> = {}
for (const f of FEATURES) {
  const xs = workUnits.map(u => u.rates[f.key] ?? 0)
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  center[f.key] = m
  spread[f.key] = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1
}

/* ── an absolute scale for the result bars ───────────────────────────────────
 * A bar normalized to the 25 results on screen always fills for the top hit, so Revelation —
 * whose closest neighbour in the whole library sits at 0.78, further than most works' 25th —
 * looked exactly as well-matched as Homer, whose closest sits at 0.24. That is the opposite of
 * what a reader needs to know.
 *
 * So the scale is published, per lens, measured from the data: the near end is the 1st
 * percentile of every work's nearest neighbour (as close as anything in this library gets),
 * and the far end is the median of all pairs (two works picked at random). A full bar then
 * means "as alike as Greek in this library gets", and an empty one means "no more alike than
 * chance", on every screen.
 */
const barScale: Record<string, [number, number]> = {}
{
  const ws = workUnits
  const pairDelta = (a: Unit, b: Unit) => {
    let sum = 0
    for (let i = 0; i < a.delta!.length; i++) sum += Math.abs(a.delta![i] - b.delta![i])
    return sum / a.delta!.length
  }
  const pairSyntax = (a: Unit, b: Unit) => {
    let sum = 0
    const keys = Object.keys(a.rates)
    for (const k of keys) sum += Math.abs((a.rates[k] ?? 0) - (b.rates[k] ?? 0)) / (spread[k] || 1)
    return sum / keys.length
  }
  const pairVocab = (a: Unit, b: Unit) => {
    const A = new Map(a.content ?? [])
    let dot = 0, na = 0, nb = 0
    for (const [, v] of a.content ?? []) na += v * v
    for (const [l, v] of b.content ?? []) { nb += v * v; const x = A.get(l); if (x !== undefined) dot += x * v }
    return na && nb ? 1 - dot / Math.sqrt(na * nb) : 1
  }
  const pct = (xs: number[], p: number) => {
    const sorted = xs.slice().sort((x, y) => x - y)
    return sorted[Math.floor(p * (sorted.length - 1))]
  }
  for (const [lens, measure] of [
    ['register', pairDelta], ['syntax', pairSyntax], ['vocabulary', pairVocab],
  ] as [string, (a: Unit, b: Unit) => number][]) {
    const nearest: number[] = []
    const every: number[] = []
    for (let i = 0; i < ws.length; i++) {
      let best = Infinity
      for (let j = 0; j < ws.length; j++) {
        if (i === j) continue
        const d = measure(ws[i], ws[j])
        if (j > i) every.push(d)
        if (d < best) best = d
      }
      if (Number.isFinite(best)) nearest.push(best)
    }
    barScale[lens] = [+pct(nearest, 0.01).toFixed(3), +pct(every, 0.5).toFixed(3)]
  }
  console.error('   bar scale per lens: '
    + Object.entries(barScale).map(([k, v]) => `${k} ${v[0]}–${v[1]}`).join(' · '))
}

/* ── write ───────────────────────────────────────────────────────────────── */
fs.mkdirSync(OUT, { recursive: true })
const round = (o: Record<string, number>, dp: number) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(dp)]))

const meta = {
  built: 'see git',
  chunkWords: CHUNK,
  minWords: MIN_CHUNK,
  reliableWords: RELIABLE,
  deltaWords: DELTA_WORDS,
  deltaLabels,
  norm: { mu: round(mu, 4), sd: round(sd, 4) },
  spread: round(spread, 4),
  center: round(center, 4),
  barScale,
  passageCorpora: Array.from(PASSAGE_CORPORA),
  features: [...RATE_FEATURES, ...CONSTRUCTIONS].map(f => ({
    key: f.key, label: f.label, chapter: f.chapter,
    taggerSensitive: !!f.taggerSensitive, approx: !!('approx' in f && f.approx),
  })),
}
// meta.json is for the SERVER, which reads it off the filesystem and so always gets the copy
// that shipped with the running deploy.
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta))

const publicUnits = units.map(u => ({
  corpus: u.corpus, work: u.work, label: WORK_LABEL.get(u.work) ?? u.work,
  kind: u.kind, idx: u.idx, n: u.n,
  reliable: u.n >= RELIABLE,
  rates: round(u.rates, 2),
  delta: u.delta!.map(x => +x.toFixed(2)),
}))

// The BROWSER gets both in one file, on purpose. A unit's `delta` is positional against
// meta.deltaWords and is scored against meta.norm, so the two only mean anything together —
// and public/data is served with an hour of cache plus stale-while-revalidate, which after a
// deploy can hand a returning reader a fresh half and a stale half. As one file that cannot
// happen. It is the same `meta` object written above, so the two copies cannot drift.
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ meta, units: publicUnits }))
// Content vocabulary, with the accented forms the biblical lexicons can supply. Coverage is
// partial by nature — those lexicons know the Septuagint and the New Testament, not Strabo —
// so a word without an entry keeps the normalized form it is stored under, the same
// fall-back-to-what-you-had rule the rest of the app's naming uses. Labels ride in the same
// file as the lists they label, for the reason index.json exists.
const vocabWorks = Object.fromEntries(
  units.filter(u => u.kind === 'work').map(u => [u.work, u.content]),
)
const vocabLabels: Record<string, string> = {}
for (const list of Object.values(vocabWorks)) {
  for (const [l] of list ?? []) {
    if (l in vocabLabels) continue
    const d = (GNT_LEMMAS[l] ?? LXX_LEMMAS[l])?.d
    if (d && d !== l) vocabLabels[l] = d
  }
}
fs.writeFileSync(path.join(OUT, 'vocab.json'),
  JSON.stringify({ labels: vocabLabels, works: vocabWorks }))
console.error(`   ${Object.keys(vocabLabels).length} of `
  + `${new Set(Object.values(vocabWorks).flatMap(v => (v ?? []).map(x => x[0]))).size}`
  + ` content words have an accented form in the biblical lexicons`)
// The passage picker's manifest: book, its work id, and words per chapter.
fs.writeFileSync(path.join(OUT, 'passages.json'), JSON.stringify(passageBooks))

const kb = (f: string) => Math.round(fs.statSync(path.join(OUT, f)).size / 1024)
console.error(`\nwrote ${OUT}/  index.json ${kb('index.json')}KB · vocab.json ${kb('vocab.json')}KB`
  + ` · passages.json ${kb('passages.json')}KB · meta.json ${kb('meta.json')}KB`)
