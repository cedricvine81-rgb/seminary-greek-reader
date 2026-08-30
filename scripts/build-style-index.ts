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
import crypto from 'node:crypto'
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



/* ── genre ───────────────────────────────────────────────────────────────────
 * A period average is a blunt comparison. Mark was being measured against a Classical figure
 * that is 123 speeches of Demosthenes, Lysias and Isocrates — the tool's own blurb admits the
 * problem when it says works of the same GENRE score alike whoever wrote them, and then offers
 * a baseline that ignores genre entirely.
 *
 * So each work is labelled, and the baselines are computed per genre as well as per period.
 * Where both pools are big enough the columns say "Classical narrative" and "Koine narrative";
 * where they are not, the column falls back to the whole period and says so, because the
 * alternative is a confident number computed from two authors.
 *
 * WHAT THIS LIBRARY CAN AND CANNOT SUPPORT, measured rather than assumed:
 *   narrative   Classical Herodotus + Thucydides only — thin, but they ARE the Classical
 *               historians, and a Gospel measured against them is a better comparison than a
 *               Gospel measured against a pile of forensic speeches
 *   oratory     Classical is rich (123 works); Koine has Dio Chrysostom and little else
 *   treatise    both sides well populated
 *   letters     CLASSICAL HAS NONE. Not a gap in the labelling — the library holds no
 *               classical epistolography at all, so a New Testament letter can never have a
 *               genre-matched Classical column, and the interface says that rather than
 *               quietly showing an unmatched one
 *
 * Labels are by work, not by author, wherever an author wrote in more than one: Plutarch's
 * Lives are narrative and his Moralia are treatises, and averaging them together would blur
 * exactly the distinction this exists to draw.
 */
type Genre = 'narrative' | 'letters' | 'oratory' | 'treatise' | 'apocalyptic' | 'poetry' | 'other'

/** Genre by author, for the Greco-Roman authors who wrote in one. */
const AUTHOR_GENRE: Record<string, Genre> = {
  Herodotus: 'narrative', Thucydides: 'narrative', Polybius: 'narrative',
  'Diogenes Laertius': 'narrative', Philostratus: 'narrative', Apollodorus: 'narrative',
  Lucian: 'narrative',                       // the two we hold are biographical satires
  Strabo: 'narrative', Pausanias: 'narrative',   // description rather than story, but prose of record
  Demosthenes: 'oratory', Lysias: 'oratory', Isocrates: 'oratory', 'Dio Chrysostom': 'oratory',
  Plato: 'treatise', Aristotle: 'treatise', Xenophon: 'treatise',
  Epictetus: 'treatise', 'Marcus Aurelius': 'treatise', Theon: 'treatise',
}

/** The Septuagint by book. The Greek prophets are their own kind of prose and stay apart. */
const LXX_GENRE: Record<string, Genre> = {}
for (const b of ('Gen Exod Lev Num Deut JoshB JudgB Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh '
  + '1Esd Tob Jdt EsthGr 1Macc 2Macc 3Macc Sus SusTh Bel BelTh').split(' ')) LXX_GENRE[b] = 'narrative'
for (const b of 'Job Ps PsSol Prov Song Wis Sir Lam Odes'.split(' ')) LXX_GENRE[b] = 'poetry'
for (const b of ('Isa Jer EpJer Bar Ezek DanLXX DanTh Hos Joel Amos Obad Jonah Mic Nah Hab Zeph '
  + 'Hag Zech Mal').split(' ')) LXX_GENRE[b] = 'apocalyptic'
LXX_GENRE['4Macc'] = 'treatise'   // a philosophical diatribe wearing a martyr story

const GNT_NARRATIVE = new Set(['Matt', 'Mark', 'Luke', 'John', 'Acts'])

/** Everything else, by work id, where a rule would be guesswork. */
const WORK_GENRE: Record<string, Genre> = {
  'josephus/antiquities': 'narrative', 'josephus/jewish-war': 'narrative',
  'josephus/life': 'narrative', 'josephus/against-apion': 'treatise',
  'eusebius/he': 'narrative', 'eusebius/pe': 'treatise',
  'justin/justin-dialogue': 'treatise', 'justin/justin-1apology': 'treatise',
  'justin/justin-2apology': 'treatise',
  'apostolic-fathers/1clement': 'letters', 'apostolic-fathers/2clement': 'letters',
  'apostolic-fathers/barnabas': 'letters', 'apostolic-fathers/diognetus': 'letters',
  'apostolic-fathers/polycarp': 'letters',
  'apostolic-fathers/ign-ephesians': 'letters', 'apostolic-fathers/ign-magnesians': 'letters',
  'apostolic-fathers/ign-philadelphians': 'letters', 'apostolic-fathers/ign-polycarp': 'letters',
  'apostolic-fathers/ign-romans': 'letters', 'apostolic-fathers/ign-smyrnaeans': 'letters',
  'apostolic-fathers/ign-trallians': 'letters',
  'apostolic-fathers/mart-polycarp': 'narrative',
  'apostolic-fathers/didache': 'other',        // a church manual, like nothing else here
  'apostolic-fathers/hermas': 'apocalyptic',
  'pseudepigrapha/aristeas': 'narrative', 'pseudepigrapha/tjob-greek': 'narrative',
  'pseudepigrapha/testaments': 'other',        // farewell discourse, neither story nor letter
  'pseudepigrapha/sibylline-greek': 'apocalyptic',
}

function genreOf(u: Unit, label: string): Genre {
  if (u.corpus === 'GNT') {
    if (GNT_NARRATIVE.has(u.work)) return 'narrative'
    return u.work === 'Rev' ? 'apocalyptic' : 'letters'
  }
  if (u.corpus === 'LXX') return LXX_GENRE[u.work] ?? 'other'
  if (WORK_GENRE[u.work]) return WORK_GENRE[u.work]
  if (u.corpus === 'philo') return 'treatise'
  if (u.corpus === 'greco') {
    const author = label.split(',')[0].trim()
    // Plutarch is both: the Lives narrate, the Moralia argue.
    if (author === 'Plutarch') return /,\s*(Life of|Comparison)/.test(label) ? 'narrative' : 'treatise'
    return AUTHOR_GENRE[author] ?? 'other'
  }
  return 'other'
}

/**
 * A genre pool needs at least this many distinct voices to be offered at all. Two, not three,
 * because Herodotus and Thucydides ARE classical narrative — there is no third — and a Gospel
 * measured against the two of them is a better comparison than a Gospel measured against a
 * pile of forensic speeches. The count travels with every pool and is shown wherever the pool
 * is offered, so nobody has to take a two-author average for more than it is.
 */
const MIN_GENRE_AUTHORS = 2

/* ── Classical and Koine baselines ───────────────────────────────────────────
 * One average over the whole library answers "is this a lot?" with a number blended from
 * Demosthenes and the Septuagint, which is not a period anyone wrote in. These two baselines
 * let a reader ask the question that actually bears on register: is this text behaving like
 * fourth-century Attic, or like the Greek of its own era?
 *
 * The division is CHRONOLOGICAL, and the labels mean periods, not registers. That distinction
 * matters here more than anywhere: Plutarch, Lucian, Dio Chrysostom and Philostratus wrote
 * under the Empire and are counted as Koine, but they are deliberate Atticizers whose prose
 * imitates the very authors in the other column. A work sitting near the Classical average is
 * therefore evidence of a classicizing REGISTER, not of an early date.
 *
 * EPIC VERSE IS IN NEITHER. Homer, Hesiod and Aratus write an artificial literary dialect that
 * belongs to no prose period; averaged into either column it would distort it. Six works,
 * 222,795 words, excluded and declared.
 *
 * ONE AUTHOR, ONE VOTE. Averaging over texts would make Demosthenes 46% of the Classical
 * baseline (63 surviving speeches) and Plutarch 48% of the Koine one (138 works) — an average
 * of two men. Each author contributes one profile, the mean of their own works. Where a
 * "corpus" is genuinely many hands — the Septuagint's translators, the New Testament's writers,
 * the Apostolic Fathers, the pseudepigrapha — each book counts as its own voice, which is what
 * it is.
 */
const CLASSICAL_AUTHORS = [
  // Attic and Ionic prose of the fifth and fourth centuries BC.
  'Herodotus', 'Thucydides', 'Plato', 'Xenophon', 'Isocrates', 'Lysias', 'Demosthenes', 'Aristotle',
]
const EPIC_AUTHORS = ['Homer', 'Hesiod', 'Aratus']
/** Corpora that are one author, however many works they left. */
const SINGLE_AUTHOR_CORPORA: Record<string, string> = {
  josephus: 'Josephus', philo: 'Philo', justin: 'Justin Martyr', eusebius: 'Eusebius',
}
/** Corpora of many hands, where each book is its own voice. */
const MANY_HANDED = ['GNT', 'LXX', 'apostolic-fathers', 'pseudepigrapha']

type Period = 'classical' | 'koine' | null

const authorOf = (u: Unit, label: string): string => {
  if (SINGLE_AUTHOR_CORPORA[u.corpus]) return SINGLE_AUTHOR_CORPORA[u.corpus]
  if (u.corpus === 'greco') return label.split(',')[0].trim()
  return label            // many-handed: the book is the voice
}

const periodOf = (u: Unit, label: string): Period => {
  if (MANY_HANDED.includes(u.corpus) || SINGLE_AUTHOR_CORPORA[u.corpus]) return 'koine'
  const author = label.split(',')[0].trim()
  if (EPIC_AUTHORS.includes(author)) return null
  return CLASSICAL_AUTHORS.includes(author) ? 'classical' : 'koine'
}

interface PeriodBaseline {
  /** Mean rate per 1,000 words, per feature, averaged over authors. */
  features: Record<string, number>
  /** The same for each Delta word. */
  words: Record<string, number>
  /** Who is in it: author, how many of their works, how many words. For the reader to check. */
  members: { author: string; corpus: string; work?: string; works: number; words: number }[]
}

function buildBaseline(members: Unit[]): PeriodBaseline {
  const byAuthor = new Map<string, Unit[]>()
  const corpusOf = new Map<string, string>()
  for (const u of members) {
    const label = WORK_LABEL.get(u.work) ?? u.work
    const a = authorOf(u, label)
    if (!byAuthor.has(a)) { byAuthor.set(a, []); corpusOf.set(a, u.corpus) }
    byAuthor.get(a)!.push(u)
  }
  const authorMeans: { rates: Record<string, number>; words: Record<string, number> }[] = []
  const roster: PeriodBaseline['members'] = []
  byAuthor.forEach((works, author) => {
    const rates: Record<string, number> = {}
    for (const f of FEATURES) {
      rates[f.key] = works.reduce((a, u) => a + (u.rates[f.key] ?? 0), 0) / works.length
    }
    const words: Record<string, number> = {}
    for (const l of DELTA_WORDS) {
      words[l] = works.reduce((a, u) => a + 1000 * ((u.lem.get(l) ?? 0) / u.n), 0) / works.length
    }
    authorMeans.push({ rates, words })
    // The work id travels with a member that IS one work, so the interface can localize a
    // biblical book's name the same way the ranking beside it does. Without it the roster
    // printed "Psalms · Genesis" next to a Spanish list reading "Salmos · Génesis".
    roster.push({
      author, corpus: corpusOf.get(author) ?? '',
      work: works.length === 1 ? works[0].work : undefined,
      works: works.length, words: works.reduce((a, u) => a + u.n, 0),
    })
  })
  const mean = (pick: (m: (typeof authorMeans)[number]) => Record<string, number>, keys: string[]) => {
    const out: Record<string, number> = {}
    for (const k of keys) {
      out[k] = +(authorMeans.reduce((a, m) => a + (pick(m)[k] ?? 0), 0) / authorMeans.length).toFixed(3)
    }
    return out
  }
  return {
    features: mean(m => m.rates, FEATURES.map(f => f.key)),
    words: mean(m => m.words, DELTA_WORDS),
    members: roster.sort((a, b) => b.words - a.words),
  }
}

const classicalUnits: Unit[] = []
const koineUnits: Unit[] = []
const excludedUnits: Unit[] = []
for (const u of workUnits) {
  const label = WORK_LABEL.get(u.work) ?? u.work
  const period = periodOf(u, label)
  if (period === 'classical') classicalUnits.push(u)
  else if (period === 'koine') koineUnits.push(u)
  else excludedUnits.push(u)
}
/**
 * Genre pools within each period, offered only where enough distinct voices stand behind them.
 * A pool that falls short is omitted entirely rather than published thin — the interface then
 * says the column is not genre-matched, which is true and checkable.
 */
function genrePools(members: Unit[]): Record<string, PeriodBaseline> {
  const byGenre = new Map<string, Unit[]>()
  for (const u of members) {
    const g = genreOf(u, WORK_LABEL.get(u.work) ?? u.work)
    if (g === 'other') continue
    if (!byGenre.has(g)) byGenre.set(g, [])
    byGenre.get(g)!.push(u)
  }
  const out: Record<string, PeriodBaseline> = {}
  byGenre.forEach((units_, g) => {
    const built = buildBaseline(units_)
    if (built.members.length >= MIN_GENRE_AUTHORS) out[g] = built
  })
  return out
}

const classicalGenres = genrePools(classicalUnits)
const koineGenres = genrePools(koineUnits)
console.error('   genre pools — classical: '
  + (Object.entries(classicalGenres).map(([g, b]) => `${g} ${b.members.length}`).join(', ') || 'none')
  + ' · koine: '
  + (Object.entries(koineGenres).map(([g, b]) => `${g} ${b.members.length}`).join(', ') || 'none'))

/** Each work's own genre, so the interface knows which pool to compare it against. */
const genreOfWork: Record<string, string> = {}
for (const u of workUnits) genreOfWork[u.work] = genreOf(u, WORK_LABEL.get(u.work) ?? u.work)

const periods = {
  classical: buildBaseline(classicalUnits),
  koine: buildBaseline(koineUnits),
  classicalGenres,
  koineGenres,
  genreOfWork,
  excluded: excludedUnits.map(u => ({
    work: u.work, label: WORK_LABEL.get(u.work) ?? u.work, words: u.n,
  })).sort((a, b) => b.words - a.words),
}
console.error(`   baselines: classical ${periods.classical.members.length} authors / `
  + `${classicalUnits.length} works · koine ${periods.koine.members.length} authors / `
  + `${koineUnits.length} works · epic verse excluded: ${excludedUnits.length} works`)

/* ── write ───────────────────────────────────────────────────────────────── */
fs.mkdirSync(OUT, { recursive: true })
const round = (o: Record<string, number>, dp: number) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(dp)]))

const meta = {
  built: 'see git',
  // Filled in below with a fingerprint of this file's own output shape. See writeShape().
  shape: '',
  chunkWords: CHUNK,
  minWords: MIN_CHUNK,
  reliableWords: RELIABLE,
  deltaWords: DELTA_WORDS,
  deltaLabels,
  norm: { mu: round(mu, 4), sd: round(sd, 4) },
  spread: round(spread, 4),
  center: round(center, 4),
  periods,
  barScale,
  passageCorpora: Array.from(PASSAGE_CORPORA),
  features: [...RATE_FEATURES, ...CONSTRUCTIONS].map(f => ({
    key: f.key, label: f.label, chapter: f.chapter,
    taggerSensitive: !!f.taggerSensitive, approx: !!('approx' in f && f.approx),
  })),
}
// meta.json is for the SERVER, which reads it off the filesystem and so always gets the copy
// that shipped with the running deploy.
/**
 * A fingerprint of the SHAPE of what this script emits — the field names, not the numbers.
 *
 * public/data is served with an hour of cache and stale-while-revalidate, so a reader who was
 * here before a deploy can be handed a file that is internally consistent and simply old. It
 * parses, and every reader of a field added since silently takes a default: a column of 0.0, a
 * roster of untranslated names, a genre selector with nothing in it. Four bugs of that one
 * shape reached testing.
 *
 * A hand-bumped version number fixes it only when someone remembers to bump it, and the fifth
 * bug was me forgetting. So the stamp is DERIVED: it hashes the key structure, is written into
 * src/lib/style-shape.ts for the interface to compile against, and therefore changes by itself
 * the moment a field is added or removed. Data and interface built together always agree; a
 * stale file never does.
 */
function shapeOf(value: unknown, depth = 0): string {
  if (Array.isArray(value)) return `[${value.length ? shapeOf(value[0], depth + 1) : ''}]`
  if (value && typeof value === 'object') {
    if (depth > 2) return '{}'
    return `{${Object.keys(value as object).sort().map(k =>
      `${k}:${shapeOf((value as Record<string, unknown>)[k], depth + 1)}`).join(',')}}`
  }
  return typeof value
}
function fingerprint(...parts: unknown[]): string {
  return crypto.createHash('sha1').update(parts.map(p => shapeOf(p)).join('|')).digest('hex').slice(0, 12)
}

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

// Content vocabulary, with the accented forms the biblical lexicons can supply. Coverage is
// partial by nature — those lexicons know the Septuagint and the New Testament, not Strabo —
// so a word without an entry keeps the normalized form it is stored under, the same
// fall-back-to-what-you-had rule the rest of the app's naming uses. Labels ride in the same
// file as the lists they label, for the reason index.json exists.
const vocabWorks = Object.fromEntries(
  units.filter(u => u.kind === 'work').map(u => [u.work, u.content]),
)
/**
 * The same two baselines for the CONTENT words, so the vocabulary lens does not show a pair of
 * empty columns. Computed over every lemma that reaches some work's list, one author one vote,
 * from the full counts rather than the truncated lists — a word absent from a work's top 200
 * is not absent from the work.
 *
 * A zero here means something different from a zero in the other two lenses, and the page says
 * so: content words track SUBJECT. Ἰησοῦς is nowhere in Classical prose because of what that
 * prose is about, not because of how it is written.
 */
function contentBaseline(members: Unit[]): Record<string, number> {
  const byAuthor = new Map<string, Unit[]>()
  for (const u of members) {
    const a = authorOf(u, WORK_LABEL.get(u.work) ?? u.work)
    if (!byAuthor.has(a)) byAuthor.set(a, [])
    byAuthor.get(a)!.push(u)
  }
  const authorCount = byAuthor.size
  const totals = new Map<string, number>()
  byAuthor.forEach(works => {
    // This author's mean rate for every lemma they use at all.
    const mine = new Map<string, number>()
    for (const u of works) {
      u.lem.forEach((c, l) => mine.set(l, (mine.get(l) ?? 0) + 1000 * (c / u.n) / works.length))
    }
    mine.forEach((r, l) => totals.set(l, (totals.get(l) ?? 0) + r))
  })
  const out: Record<string, number> = {}
  totals.forEach((sum, l) => {
    const mean = sum / authorCount
    // Rounded to two places; anything that rounds to nought is left out and read as nought,
    // which keeps the file from carrying twelve thousand zeroes.
    const r = +mean.toFixed(2)
    if (r > 0) out[l] = r
  })
  return out
}

const vocabLabels: Record<string, string> = {}
for (const list of Object.values(vocabWorks)) {
  for (const [l] of list ?? []) {
    if (l in vocabLabels) continue
    const d = (GNT_LEMMAS[l] ?? LXX_LEMMAS[l])?.d
    if (d && d !== l) vocabLabels[l] = d
  }
}
// Only the lemmas some work actually lists — a baseline for a word the lens can never show
// would be payload with no reader.
const listed = new Set(Object.values(vocabWorks).flatMap(v => (v ?? []).map(x => x[0])))
const trim = (all: Record<string, number>) => {
  const out: Record<string, number> = {}
  listed.forEach(l => { if (all[l] !== undefined) out[l] = all[l] })
  return out
}
const vocabPeriods = {
  classical: trim(contentBaseline(classicalUnits)),
  koine: trim(contentBaseline(koineUnits)),
}
console.error(`   content baselines: ${Object.keys(vocabPeriods.classical).length} classical / `
  + `${Object.keys(vocabPeriods.koine).length} koine lemmas of ${listed.size} listed`)
console.error(`   ${Object.keys(vocabLabels).length} of `
  + `${new Set(Object.values(vocabWorks).flatMap(v => (v ?? []).map(x => x[0]))).size}`
  + ` content words have an accented form in the biblical lexicons`)
const vocabFile = { shape: '', labels: vocabLabels, works: vocabWorks, periods: vocabPeriods }
const SHAPE = fingerprint(meta, publicUnits[0], vocabFile, passageBooks)
meta.shape = SHAPE
vocabFile.shape = SHAPE
// Written for the interface to compile against, so the two can never disagree by oversight.
fs.writeFileSync('src/lib/style-shape.ts',
  '// GENERATED by scripts/build-style-index.ts — do not edit.\n'
  + '// A fingerprint of the shape of public/data/style. The interface refuses an index whose\n'
  + '// stamp differs from this and refetches past the cache; see the note in the builder.\n'
  + `export const STYLE_SHAPE = '${SHAPE}'\n`)

fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta))
// The BROWSER gets meta and units in ONE file, on purpose. A unit's `delta` is positional
// against meta.deltaWords and is scored against meta.norm, so the two only mean anything
// together — and public/data is served with an hour of cache plus stale-while-revalidate,
// which after a deploy can hand a returning reader a fresh half and a stale half.
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ meta, units: publicUnits }))
fs.writeFileSync(path.join(OUT, 'vocab.json'), JSON.stringify(vocabFile))
// The passage picker's manifest: book, its work id, and words per chapter.
fs.writeFileSync(path.join(OUT, 'passages.json'), JSON.stringify(passageBooks))

const kb = (f: string) => Math.round(fs.statSync(path.join(OUT, f)).size / 1024)
console.error(`\nwrote ${OUT}/  index.json ${kb('index.json')}KB · vocab.json ${kb('vocab.json')}KB`
  + ` · passages.json ${kb('passages.json')}KB · meta.json ${kb('meta.json')}KB`)
