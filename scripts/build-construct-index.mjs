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

// ─── Per-corpus build ─────────────────────────────────────────────────────────

function buildCorpus(name, osisIds, collect) {
  const books = {}
  let wordCount = 0, noPos = 0
  // Lemma statistics, for the word field's predictive dropdown and form narrowing.
  const posCounts = {}, featCounts = {}, spellingCounts = {}, glossCounts = {}, strongsCounts = {}, totals = {}

  for (const osis of osisIds) {
    let raw
    try { raw = collect(osis) } catch { continue }     // book not present in this corpus's data
    if (!raw.length) continue
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
      if (lemmaNorm && pos) {
        ;(posCounts[lemmaNorm] ??= {})[pos] = ((posCounts[lemmaNorm] ?? {})[pos] ?? 0) + 1
        const feats = (featCounts[lemmaNorm] ??= {})
        for (const tok of t.toks.slice(1)) feats[tok] = (feats[tok] ?? 0) + 1
        totals[lemmaNorm] = (totals[lemmaNorm] ?? 0) + 1
        if (t.lemmaRaw) (spellingCounts[lemmaNorm] ??= {})[t.lemmaRaw] = ((spellingCounts[lemmaNorm] ?? {})[t.lemmaRaw] ?? 0) + 1
        if (t.gloss) (glossCounts[lemmaNorm] ??= {})[t.gloss] = ((glossCounts[lemmaNorm] ?? {})[t.gloss] ?? 0) + 1
        if (t.strongs) (strongsCounts[lemmaNorm] ??= {})[t.strongs] = ((strongsCounts[lemmaNorm] ?? {})[t.strongs] ?? 0) + 1
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
function lemmaTable({ posCounts, featCounts, spellingCounts, glossCounts, strongsCounts, totals }) {
  const table = {}
  let singlePos = 0, fixedGender = 0, lexGloss = 0
  for (const lemma in posCounts) {
    const entry = {}
    entry.p = Object.entries(posCounts[lemma]).sort((a, b) => b[1] - a[1]).map(([p]) => p)
    if (entry.p.length === 1) singlePos++
    const spelling = topOf(spellingCounts[lemma])
    if (spelling && spelling !== lemma) entry.d = spelling
    const strongs = topOf(strongsCounts[lemma])
    const fromLexicon = strongs ? shortGloss(lexicon[`G${strongs}`]?.thayer) : ''
    if (fromLexicon) lexGloss++
    const gloss = fromLexicon || topOf(glossCounts[lemma])
    if (gloss) entry.g = gloss
    entry.n = totals[lemma] ?? 0

    const feats = featCounts[lemma] ?? {}
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
    table[lemma] = entry
  }
  return { table, singlePos, fixedGender, lexGloss }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const corpora = [
  buildCorpus('GNT', booksMeta.gnt.map(b => b.osisId), collectGNT),
  buildCorpus('LXX', booksMeta.lxx.map(b => b.osisId), collectLXX),
]

const index = { version: 3, corpora: {} }
for (const c of corpora) index.corpora[c.name] = c.books
const json = JSON.stringify(index)
const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 })
fs.writeFileSync(path.join(DATA, 'construct-index.json.gz'), gz)
console.log(`index: ${(gz.length / 1e6).toFixed(2)} MB gz (${(json.length / 1e6).toFixed(1)} MB raw)`)
for (const c of corpora) {
  const verses = Object.values(c.books).reduce((n, b) => n + b.v.length, 0)
  console.log(`  ${c.name}: ${Object.keys(c.books).length} books · ${verses} verses · ${c.wordCount} words · ${c.noPos} without a part of speech`)
}

// The GNT table is small enough for the browser to hold, which makes its word field instant.
// The LXX has 44,249 lemmas — mostly rare proper nouns — and comes to 8 MB, too much to load into
// a page, so it ships GZIPPED and is read server-side by /api/construct/lemmas instead. Both live
// under public/data because that is what reliably reaches the deployment.
for (const c of corpora) {
  const { table, singlePos, fixedGender, lexGloss } = lemmaTable(c.stats)
  const n = Object.keys(table).length
  const stem = `lemma-forms-${c.name.toLowerCase()}`
  const json = JSON.stringify(table)
  let written
  if (c.name === 'GNT') {
    written = path.join(DATA, `${stem}.json`)
    fs.writeFileSync(written, json)
  } else {
    written = path.join(DATA, `${stem}.json.gz`)
    fs.writeFileSync(written, zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 }))
  }
  console.log(`${path.basename(written)}: ${n} lemmas · ${singlePos} single-pos · ${fixedGender} fixed gender · ${lexGloss} lexicon glosses · ${(fs.statSync(written).size / 1024).toFixed(0)} KB`)
}
// Superseded by the per-corpus tables above.
fs.rmSync(path.join(DATA, 'lemma-forms.json'), { force: true })
fs.rmSync(path.join(DATA, 'lemma-pos.json'), { force: true })
fs.rmSync(path.join(DATA, 'lemma-forms-lxx.json'), { force: true })
