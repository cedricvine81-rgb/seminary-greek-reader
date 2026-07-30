// Build the flat token index for Construct search (two/three words near each other), plus the
// per-corpus lemma tables that drive the word field.
//
// Outputs:
//   public/data/construct-index.json.gz   both corpora, flat token streams
//   public/data/lemma-forms-gnt.json      lemma → attested forms / gloss / frequency
//   public/data/lemma-forms-lxx.json      ditto for the Septuagint
//
// Sources: the parsing trees (public/data/phrase-tree/<book>.json — gold GNT tagging, the same
// that feeds build-word-index.mjs) and the LXX chapter files (public/data/lxx/<book>_<ch>.json,
// whose `morph` object carries full morphology).
//
// Why a SECOND index rather than reusing word-index.json.gz:
//   1. word-index is grouped BY VERSE, so "within 4 words" could never cross a verse
//      boundary. Proximity needs one flat token stream per book.
//   2. The tree walk is NOT surface order — ~10% of GNT tokens come out transposed
//      because the trees carry discontinuous constituents (e.g. 1Pet 4:1-2). Harmless
//      for word-index (an AND-of-features test per word ignores order), fatal for a
//      distance test. Here every token is sorted by its id: chapter, verse, word number.
//   3. Leaving word-index.json.gz untouched keeps the shipped morphology / Strong's
//      searches in src/lib/search.ts exactly as they are.
//
// Shape:
//   { version: 3, corpora: { GNT: <books>, LXX: <books> } }
//   <books> = { <osisId>: {
//       w: [ [strongs, lemmaNorm, parsingLower], ... ],   // flat, canonical surface order
//       v: [ [chapter, verse, startIndex], ... ]          // sorted; a verse owns w[start .. nextStart)
//     } }
// Books are emitted in canonical order (public/data/books.json), which the engine relies on to
// return hits in reading order.
//
// Usage:  node scripts/build-construct-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const DATA = path.join(process.cwd(), 'public', 'data')
const booksMeta = JSON.parse(fs.readFileSync(path.join(DATA, 'books.json'), 'utf8'))

const LETTERS = /[^A-Za-zÀ-ɏͰ-῿]/g
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ─── Morphology vocabulary ────────────────────────────────────────────────────
// Mirrors MORPH_GROUPS / POS_CATEGORIES in src/lib/morph-features.ts (this script is standalone
// node, so the vocabulary is repeated — keep the two in step).
const CATEGORIES = {
  tense:  ['present', 'imperfect', 'future', 'aorist', 'perfect', 'pluperfect'],
  voice:  ['active', 'middle', 'passive', 'middlepassive'],
  mood:   ['indicative', 'subjunctive', 'imperative', 'optative', 'infinitive', 'participle'],
  person: ['1 person', '2 person', '3 person'],
  case:   ['nominative', 'genitive', 'dative', 'accusative', 'vocative'],
  number: ['singular', 'plural'],
  gender: ['masculine', 'feminine', 'neuter'],
  degree: ['comparative', 'superlative'],
}
const POS_CATEGORIES = {
  noun:         ['case', 'number', 'gender'],
  verb:         ['tense', 'voice', 'mood', 'person', 'number', 'case', 'gender'],
  article:      ['case', 'number', 'gender'],
  adjective:    ['case', 'number', 'gender', 'degree'],
  pronoun:      ['person', 'case', 'number', 'gender'],
  number:       ['case', 'number', 'gender'],
  adverb:       ['degree'],
  preposition:  [],
  conjunction:  [],
  particle:     [],
  interjection: [],
}

// ─── LXX tag normalisation ────────────────────────────────────────────────────
// The LXX chapter files use a different (and slightly noisier) vocabulary than the GNT trees.
// Verified against all 586,991 words: everything below maps cleanly, and only ~136 words end up
// without a part of speech.
const LXX_POS = {
  Noun: 'noun', Verb: 'verb', Article: 'article', Adjective: 'adjective', Adverb: 'adverb',
  Conjunction: 'conjunction', Preposition: 'preposition', Particle: 'particle',
  Interjection: 'interjection',
  // Pronoun subtypes all collapse to `pronoun` — the finer distinction isn't in our vocabulary.
  'Demonstrative': 'pronoun', 'Indefinite Pronoun': 'pronoun', 'Interrogative Pronoun': 'pronoun',
  'Relative Pronoun': 'pronoun', RP: 'pronoun',
  // 'M' is the numeral tag (ἑπτά, τριάκοντα) — 3,328 words.
  M: 'number',
}
// X/Y/Z are the perfect system, absent from the named tenses: πεπτωκότας (perfect),
// ᾠκοδόμητο (pluperfect), κεκλήσεται (future perfect — one word, and we have no token for it).
const LXX_TENSE = {
  Present: 'present', Imperfect: 'imperfect', Future: 'future', Aorist: 'aorist',
  X: 'perfect', Y: 'pluperfect',
}
const LXX_SIMPLE = {
  casus:  { Nominative: 'nominative', Genitive: 'genitive', Dative: 'dative', Accusative: 'accusative', Vocative: 'vocative' },
  number: { Singular: 'singular', Plural: 'plural' },
  gender: { Masculine: 'masculine', Feminine: 'feminine', Neuter: 'neuter' },
  voice:  { Active: 'active', Middle: 'middle', Passive: 'passive' },
  mood:   { Indicative: 'indicative', Subjunctive: 'subjunctive', Imperative: 'imperative', Optative: 'optative', Infinitive: 'infinitive', Participle: 'participle' },
  person: { 1: '1 person', 2: '2 person', 3: '3 person', '1': '1 person', '2': '2 person', '3': '3 person' },
}

// Same token ORDER the GNT trees use, so the two corpora read alike in any debugging output.
// (Matching is a membership test, so order carries no meaning.)
function lxxTokens(morph) {
  if (!morph) return []
  const out = []
  const pos = LXX_POS[morph.partOfSpeech]
  if (pos) out.push(pos)
  const tense = LXX_TENSE[morph.tense]
  if (tense) out.push(tense)
  for (const [field, table] of [['voice', LXX_SIMPLE.voice], ['mood', LXX_SIMPLE.mood], ['person', LXX_SIMPLE.person],
                                ['number', LXX_SIMPLE.number], ['casus', LXX_SIMPLE.casus], ['gender', LXX_SIMPLE.gender]]) {
    const v = table[morph[field]]
    if (v) out.push(v)
  }
  return out
}

// ─── Collection ───────────────────────────────────────────────────────────────
// Each corpus yields, per book, a list of { chapter, verse, num, strongs, lemmaRaw, gloss, toks }.

function collectGNT(osis) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, 'phrase-tree', `${osis}.json`), 'utf8'))
  const out = []
  const walk = n => {
    if (n.t === 'w' && n.id) {
      const p = String(n.id).split('.')            // <book>.<chapter>.<verse>.<wordNum>
      const chapter = Number(p[1]), verse = Number(p[2]), num = Number(p[3])
      if (!Number.isFinite(chapter) || !Number.isFinite(verse) || !Number.isFinite(num)) return
      const parsing = String(n.parsing ?? '').toLowerCase().trim()
      const strongs = n.strongs ? String(n.strongs) : ''
      if (!strongs && !parsing) return
      out.push({
        chapter, verse, num, strongs,
        lemmaRaw: n.lemma ? String(n.lemma).trim() : '',
        gloss: n.gloss ? String(n.gloss).trim() : '',
        toks: parsing.split(',').map(t => t.trim()).filter(Boolean),
      })
    } else {
      ;(n.c ?? []).forEach(walk)
    }
  }
  for (const s of d.sentences ?? []) walk(s.tree)
  return out
}

function collectLXX(osis) {
  const out = []
  // Chapter files are <osis>_<n>.json; read them in numeric order (the sort below makes the
  // file order irrelevant, but this keeps things predictable).
  const files = fs.readdirSync(path.join(DATA, 'lxx'))
    .filter(f => f.startsWith(`${osis}_`) && f.endsWith('.json'))
    .sort((a, b) => Number(a.match(/_(\d+)\.json$/)?.[1] ?? 0) - Number(b.match(/_(\d+)\.json$/)?.[1] ?? 0))
  for (const f of files) {
    const d = JSON.parse(fs.readFileSync(path.join(DATA, 'lxx', f), 'utf8'))
    for (const v of d.verses ?? []) {
      for (const w of v.words ?? []) {
        const toks = lxxTokens(w.morph)
        const strongs = w.strongs ? String(w.strongs) : ''
        if (!strongs && toks.length === 0) continue
        out.push({
          chapter: Number(v.chapter), verse: Number(v.verse), num: Number(w.position ?? 0), strongs,
          lemmaRaw: w.lemma ? String(w.lemma).trim() : '',
          gloss: '',                                  // the LXX files carry no per-word gloss
          toks,
        })
      }
    }
  }
  return out
}

// ─── Prose corpora ────────────────────────────────────────────────────────────
// Josephus, Philo, the Apostolic Fathers, the pseudepigrapha, Eusebius, Justin and the
// Greco-Roman texts carry Stanza-tagged `.morph.json` sidecars beside their chapter files
// (scripts/build-texts-morph.py). Shape: { "<chapter>.<verse>": [[lemma, "POS, Case, …"], …] }.
//
// MACHINE-TAGGED, unlike the GNT (hand-tagged) and the LXX. Roughly 90-95% accurate, so a hit is
// evidence rather than proof — the UI says so. The vocabulary is close to ours and maps cleanly.
const PROSE_POS = {
  Noun: 'noun', Verb: 'verb', Article: 'article', Adjective: 'adjective', Adverb: 'adverb',
  Conjunction: 'conjunction', Preposition: 'preposition', Particle: 'particle',
  Pronoun: 'pronoun', Interjection: 'interjection', Numeral: 'number',
}
const PROSE_TOKEN = {
  // Person is spelled ordinally here.
  '1st': '1 person', '2nd': '2 person', '3rd': '3 person',
  Nominative: 'nominative', Genitive: 'genitive', Dative: 'dative', Accusative: 'accusative', Vocative: 'vocative',
  Singular: 'singular', Plural: 'plural',
  Masculine: 'masculine', Feminine: 'feminine', Neuter: 'neuter',
  Present: 'present', Imperfect: 'imperfect', Future: 'future', Aorist: 'aorist',
  Perfect: 'perfect', Pluperfect: 'pluperfect',
  Active: 'active', Middle: 'middle', Passive: 'passive',
  Indicative: 'indicative', Subjunctive: 'subjunctive', Imperative: 'imperative',
  Optative: 'optative', Infinitive: 'infinitive', Participle: 'participle',
  Comparative: 'comparative', Superlative: 'superlative',
  // 'Dual' is dropped: 2,126 tokens in 2.4M (0.09%), and adding a dual to the vocabulary would put
  // an option on every card that can never match in the New Testament or the Septuagint. Those
  // words stay searchable by their other features.
}

// Corpora to index, and where their works live. The book key is the work's data path relative to
// /data, minus the extension ('greco/aristotle-poetics') — the server maps that back to the entry
// in prose-texts.ts (by dataUrl) for its display name and Texts-reader link, so this script needs
// no knowledge of the registry's id conventions.
const PROSE_CORPORA = {
  josephus: 'josephus',
  philo: 'philo',
  'apostolic-fathers': 'apostolic-fathers',
  pseudepigrapha: 'pseudepigrapha',
  eusebius: 'eusebius',
  justin: 'justin',
  greco: 'greco',
}

function proseWorks(dir) {
  const root = path.join(DATA, dir)
  const out = []
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.morph.json')) {
        const rel = path.relative(DATA, p).replace(/\.morph\.json$/, '')
        out.push(rel)
      }
    }
  }
  walk(root)
  return out.sort()
}

function collectProse(relPath) {
  const morph = JSON.parse(fs.readFileSync(path.join(DATA, `${relPath}.morph.json`), 'utf8'))
  const out = []
  // Two key shapes in the wild: '<chapter>.<verse>' for most works, and a bare '<verse>' for
  // Josephus, whose files ARE the chapter ('josephus/jewish-war/4.morph.json'). Getting this wrong
  // silently indexes nothing, which is exactly what happened before the fallback existed.
  const fileChapter = Number(path.basename(relPath))
  for (const key of Object.keys(morph)) {
    const parts = key.split('.').map(Number)
    const chapter = parts.length > 1 ? parts[0] : fileChapter
    const verse = parts.length > 1 ? parts[1] : parts[0]
    if (!Number.isFinite(chapter) || !Number.isFinite(verse)) continue
    const words = morph[key] ?? []
    words.forEach((w, i) => {
      if (!w) return
      const toks = String(w[1] ?? '').split(',').map(t => t.trim()).filter(Boolean)
      const mapped = []
      const pos = PROSE_POS[toks[0]]
      if (pos) mapped.push(pos)
      for (const t of toks.slice(1)) { const v = PROSE_TOKEN[t]; if (v) mapped.push(v) }
      if (!mapped.length && !w[0]) return
      out.push({
        chapter, verse, num: i + 1,
        strongs: '',                       // the prose sidecars carry no Strong's numbers
        lemmaRaw: w[0] ? String(w[0]).trim() : '',
        gloss: '',
        toks: mapped,
      })
    })
  }
  return out
}

// ─── Per-corpus build ─────────────────────────────────────────────────────────

// `keyBy` decides what counts as "the same word" when building the lemma table:
//   'lemma'   — the GNT trees carry real lemmas, so group by those.
//   'strongs' — the LXX chapter files DON'T: their `lemma` is a verbatim copy of the surface form
//               (identical in 100% of sampled words). Strong's numbers are the only lexeme
//               identity available there — 91.9% of tokens carry one, they group inflected forms
//               correctly (ἠγάπησάς / ἀγαπᾷς / ἀγαπᾶν all under G25), and the lexicon supplies a
//               dictionary form for 98.6% of them.
function buildCorpus(name, osisIds, collect, keyBy = 'lemma') {
  const books = {}
  let wordCount = 0, noPos = 0
  // Lemma statistics, for the word field's predictive dropdown and form narrowing.
  const posCounts = {}, featCounts = {}, spellingCounts = {}, glossCounts = {}, strongsCounts = {}, totals = {}

  for (const osis of osisIds) {
    let raw
    try {
      raw = collect(osis)
    } catch (err) {
      // Loudly: a silently skipped work is indistinguishable from one with no matches.
      console.warn(`  ! ${name}: could not read ${osis} — ${err.message}`)
      continue
    }
    if (!raw.length) { console.warn(`  ! ${name}: ${osis} yielded no tagged words`); continue }
    // The GNT tree walk can't be trusted for order (see header note 2), and sorting is harmless
    // for the LXX, so both corpora are sorted by their word ids.
    raw.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse || a.num - b.num)

    const w = [], v = []
    let curCh = -1, curV = -1
    for (const t of raw) {
      if (t.chapter !== curCh || t.verse !== curV) {
        v.push([t.chapter, t.verse, w.length])
        curCh = t.chapter; curV = t.verse
      }
      const parsing = t.toks.join(', ')
      const lemmaNorm = t.lemmaRaw ? normalize(t.lemmaRaw.replace(LETTERS, '')) : ''
      w.push([t.strongs, lemmaNorm, parsing])

      const pos = t.toks[0]
      if (!pos) noPos++
      // What groups this token with its fellow forms — see keyBy above.
      const key = keyBy === 'strongs' ? t.strongs : lemmaNorm
      if (key && pos) {
        ;(posCounts[key] ??= {})[pos] = ((posCounts[key] ?? {})[pos] ?? 0) + 1
        const feats = (featCounts[key] ??= {})
        for (const tok of t.toks.slice(1)) feats[tok] = (feats[tok] ?? 0) + 1
        totals[key] = (totals[key] ?? 0) + 1
        if (t.lemmaRaw) (spellingCounts[key] ??= {})[t.lemmaRaw] = ((spellingCounts[key] ?? {})[t.lemmaRaw] ?? 0) + 1
        if (t.gloss) (glossCounts[key] ??= {})[t.gloss] = ((glossCounts[key] ?? {})[t.gloss] ?? 0) + 1
        if (t.strongs) (strongsCounts[key] ??= {})[t.strongs] = ((strongsCounts[key] ?? {})[t.strongs] ?? 0) + 1
      }
    }
    books[osis] = { w, v }
    wordCount += w.length
  }

  return { name, books, wordCount, noPos, stats: { posCounts, featCounts, spellingCounts, glossCounts, strongsCounts, totals } }
}

// ─── Lemma tables ─────────────────────────────────────────────────────────────
// Thayer's opening clause makes a serviceable one-line gloss ("I come, go" for ἔρχομαι) — better
// than the corpus's per-form gloss, whose commonest value for ἔρχομαι is "having come", a
// participle's sense rather than the word's.
const lexicon = JSON.parse(fs.readFileSync(path.join(DATA, 'greek-lexicon.json'), 'utf8'))
const shortGloss = s => {
  if (!s) return ''
  const first = String(s).trim().split(/[;.]/)[0].trim()
  return first.length > 32 ? first.slice(0, 30).replace(/[,\s]+\S*$/, '') + '…' : first
}
const topOf = counts => (counts ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : '')

// Pure attestation (count >= 1): a value is offered if the corpus ever tags this lemma that way.
// No frequency threshold — pruning rare-but-real forms would make a legitimate search
// unexpressible, and the GNT tagging is hand-made, so stray values are not a real problem.
function lemmaTable({ posCounts, featCounts, spellingCounts, glossCounts, strongsCounts, totals }, keyBy = 'lemma') {
  const table = {}
  let singlePos = 0, fixedGender = 0, lexGloss = 0, noDictionaryForm = 0
  for (const group in posCounts) {
    const entry = {}
    entry.p = Object.entries(posCounts[group]).sort((a, b) => b[1] - a[1]).map(([p]) => p)
    if (entry.p.length === 1) singlePos++
    const strongs = keyBy === 'strongs' ? group : topOf(strongsCounts[group])
    // The key the user types against. Grouped by Strong's, that's the lexicon's dictionary form —
    // the whole point, since the corpus itself only has surface forms. Where the lexicon has no
    // entry (58 of 4,045 LXX numbers, mostly extended 7xxxx codes) fall back to the commonest
    // surface form, which at least remains findable.
    const spelling = keyBy === 'strongs'
      ? (lexicon[`G${strongs}`]?.lemma || topOf(spellingCounts[group]))
      : topOf(spellingCounts[group])
    if (keyBy === 'strongs' && !lexicon[`G${strongs}`]?.lemma) noDictionaryForm++
    const lemma = keyBy === 'strongs' ? normalize(String(spelling).replace(LETTERS, '')) : group
    if (!lemma) continue
    if (spelling && spelling !== lemma) entry.d = spelling
    // Carried so the engine can match every inflected form by number rather than by string.
    if (keyBy === 'strongs' && strongs) entry.s = [strongs]
    const fromLexicon = strongs ? shortGloss(lexicon[`G${strongs}`]?.thayer) : ''
    if (fromLexicon) lexGloss++
    const gloss = fromLexicon || topOf(glossCounts[group])
    if (gloss) entry.g = gloss
    entry.n = totals[group] ?? 0

    const feats = featCounts[group] ?? {}
    // The categories any of this lemma's attested parts of speech could take. Recording one as
    // EMPTY within that set is what lets the reader hide it: ἵνα is tagged conjunction or adverb,
    // so "degree" is on the table in principle but never occurs, and offering it would only ever
    // return nothing. Categories outside the set are simply absent, meaning "no restriction".
    const relevant = new Set(entry.p.flatMap(p => POS_CATEGORIES[p] ?? []))
    for (const [cat, values] of Object.entries(CATEGORIES)) {
      const seen = values.filter(v => feats[v])
      if (seen.length < values.length && (seen.length > 0 || relevant.has(cat))) entry[cat] = seen
    }
    if (entry.gender?.length === 1) fixedGender++
    // Two Strong's numbers can share a dictionary form. Merge rather than clobber, so a search on
    // that word still reaches every number behind it.
    const prev = table[lemma]
    if (prev) {
      const union = (a = [], b = []) => Array.from(new Set([...a, ...b]))
      entry.p = union(prev.p, entry.p)
      entry.s = union(prev.s, entry.s)
      entry.n = (prev.n ?? 0) + (entry.n ?? 0)
      entry.d = prev.d ?? entry.d
      entry.g = prev.g ?? entry.g
      // A category is only a restriction if it restricts for BOTH; otherwise drop it.
      for (const cat of Object.keys(CATEGORIES)) {
        if (prev[cat] && entry[cat]) entry[cat] = union(prev[cat], entry[cat])
        else delete entry[cat]
      }
    }
    table[lemma] = entry
  }
  return { table, singlePos, fixedGender, lexGloss, noDictionaryForm }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const corpora = [
  buildCorpus('GNT', booksMeta.gnt.map(b => b.osisId), collectGNT),
  buildCorpus('LXX', booksMeta.lxx.map(b => b.osisId), collectLXX, 'strongs'),
  // Prose: machine-tagged, no Strong's numbers, so lexemes group by the sidecar's own lemma —
  // which here IS a real lemma (Stanza emits one), unlike the LXX chapter files.
  ...Object.entries(PROSE_CORPORA).map(([name, dir]) =>
    buildCorpus(name, proseWorks(dir), collectProse)),
]

// One file per corpus under public/data/construct/, loaded on demand by the engine. The prose
// corpora are far too large to sit in one combined index — see getCorpus in construct-search.ts.
const outDir = path.join(DATA, 'construct')
fs.mkdirSync(outDir, { recursive: true })
let totalGz = 0
for (const c of corpora) {
  const json = JSON.stringify(c.books)
  const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 })
  fs.writeFileSync(path.join(outDir, `${c.name}.json.gz`), gz)
  totalGz += gz.length
  const verses = Object.values(c.books).reduce((n, b) => n + b.v.length, 0)
  console.log(`  ${c.name.padEnd(18)} ${String(Object.keys(c.books).length).padStart(3)} works · ${String(verses).padStart(6)} verses · ${String(c.wordCount).padStart(7)} words · ${(gz.length / 1e6).toFixed(2)} MB gz${c.noPos ? ` · ${c.noPos} untagged` : ''}`)
}
console.log(`index total: ${(totalGz / 1e6).toFixed(2)} MB gz across ${corpora.length} files`)
// Superseded by the per-corpus files.
fs.rmSync(path.join(DATA, 'construct-index.json.gz'), { force: true })

// Both lemma tables ship to the browser, so the word field responds per keystroke with no
// request. /api/construct/lemmas serves the same data for anything too large to ship that way —
// it is what the LXX needed before Strong's grouping shrank it, and what the prose corpora will
// need in Phase 3.
for (const c of corpora) {
  const keyBy = c.name === 'LXX' ? 'strongs' : 'lemma'
  const { table, singlePos, fixedGender, lexGloss, noDictionaryForm } = lemmaTable(c.stats, keyBy)
  const n = Object.keys(table).length
  // The biblical tables are small enough to hold in the page, which keeps those word fields
  // instant: grouping the LXX by Strong's collapsed 44,249 surface forms into ~4,000 lexemes.
  // The prose corpora are another matter — Greco-Roman alone has 43,890 lexemes / 6.9 MB — so
  // theirs ship gzipped and are read by /api/construct/lemmas instead.
  const stem = `lemma-forms-${c.name.toLowerCase()}`
  const inPage = c.name === 'GNT' || c.name === 'LXX'
  const written = path.join(DATA, inPage ? `${stem}.json` : `${stem}.json.gz`)
  const body = JSON.stringify(table)
  fs.writeFileSync(written, inPage ? body : zlib.gzipSync(Buffer.from(body, 'utf8'), { level: 9 }))
  console.log(`${path.basename(written)}: ${n} lexemes (by ${keyBy}) · ${singlePos} single-pos · ${fixedGender} fixed gender · ${lexGloss} lexicon glosses${noDictionaryForm ? ` · ${noDictionaryForm} without a dictionary form` : ''} · ${(fs.statSync(written).size / 1024).toFixed(0)} KB`)
}
// Superseded by the per-corpus tables above.
fs.rmSync(path.join(DATA, 'lemma-forms.json'), { force: true })
fs.rmSync(path.join(DATA, 'lemma-pos.json'), { force: true })
fs.rmSync(path.join(DATA, 'lemma-forms-lxx.json.gz'), { force: true })
