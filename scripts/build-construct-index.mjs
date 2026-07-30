// Build the flat token index for Construct search (two/three words near each other).
// Source: the parsing trees (public/data/phrase-tree/<book>.json), the same gold GNT
// tagging that feeds build-word-index.mjs. Output: public/data/construct-index.json.gz
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
//   { version: 2, books: { <osisId>: {
//       w: [ [strongs, lemmaNorm, parsingLower], ... ],   // flat, canonical surface order
//       v: [ [chapter, verse, startIndex], ... ]          // sorted; a verse owns w[start .. nextStart)
//     } } }
//
// Usage:  node scripts/build-construct-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const GNT = ['Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil',
  'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1Pet', '2Pet',
  '1John', '2John', '3John', 'Jude', 'Rev']

const LETTERS = /[^A-Za-zÀ-ɏͰ-῿]/g
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const books = {}
let wordCount = 0
// normalized lemma → { pos: count } — collapsed below into the DOMINANT part of speech per
// lemma, so Construct search can derive a word's part of speech from the word itself and show
// only the categories that word can take.
const lemmaPosCounts = {}
// normalized lemma → { <parsing token>: count } over every OTHER parsing token, so the form
// dropdowns can offer only what that word is actually ATTESTED in. λόγος is masculine and
// nothing else, so gender stops being a question; a noun never found in the vocative doesn't
// offer one (which would only ever return nothing). Output: public/data/lemma-forms.json
const lemmaFeatCounts = {}
// normalized lemma → { <accented spelling>: count } and → { <gloss>: count }, plus a total
// occurrence count. These drive the predictive dropdown on the word field: suggest the properly
// accented lemma, show what it means, and rank by how common it is in the corpus.
const lemmaSpellingCounts = {}
const lemmaGlossCounts = {}
const lemmaTotals = {}
// normalized lemma → { <strongs>: count }, so the dropdown's gloss can come from the lexicon
// (a LEXICAL gloss) rather than the corpus's per-form gloss — the commonest corpus gloss for
// ἔρχομαι is "having come", which is a participle's sense, not the word's.
const lemmaStrongsCounts = {}

for (const osis of GNT) {
  const file = path.join(process.cwd(), 'public', 'data', 'phrase-tree', `${osis}.json`)
  const d = JSON.parse(fs.readFileSync(file, 'utf8'))

  // Collect every tagged word with its id coordinates, then sort — the walk order can't be
  // trusted (see header note 2).
  const raw = []
  const walk = n => {
    if (n.t === 'w' && n.id) {
      const p = String(n.id).split('.')            // <book>.<chapter>.<verse>.<wordNum>
      const chapter = Number(p[1]), verse = Number(p[2]), num = Number(p[3])
      if (!Number.isFinite(chapter) || !Number.isFinite(verse) || !Number.isFinite(num)) return
      const strongs = n.strongs ? String(n.strongs) : ''
      const lemmaNorm = n.lemma ? normalize(String(n.lemma).replace(LETTERS, '')) : ''
      const parsing = String(n.parsing ?? '').toLowerCase().trim()
      if (!strongs && !parsing) return
      raw.push({ chapter, verse, num, row: [strongs, lemmaNorm, parsing] })
      // First parsing token is the part of speech ('verb, aorist, active, …'); the rest are the
      // form's features.
      const toks = parsing.split(',').map(t => t.trim()).filter(Boolean)
      const pos = toks[0]
      if (lemmaNorm && pos) {
        const counts = (lemmaPosCounts[lemmaNorm] ??= {})
        counts[pos] = (counts[pos] ?? 0) + 1
        const feats = (lemmaFeatCounts[lemmaNorm] ??= {})
        for (const t of toks.slice(1)) feats[t] = (feats[t] ?? 0) + 1
        lemmaTotals[lemmaNorm] = (lemmaTotals[lemmaNorm] ?? 0) + 1
        // The lemma as the corpus spells it, accents and all — what the dropdown should show.
        const spelling = n.lemma ? String(n.lemma).trim() : ''
        if (spelling) {
          const sp = (lemmaSpellingCounts[lemmaNorm] ??= {})
          sp[spelling] = (sp[spelling] ?? 0) + 1
        }
        const gloss = n.gloss ? String(n.gloss).trim() : ''
        if (gloss) {
          const gl = (lemmaGlossCounts[lemmaNorm] ??= {})
          gl[gloss] = (gl[gloss] ?? 0) + 1
        }
        if (strongs) {
          const st = (lemmaStrongsCounts[lemmaNorm] ??= {})
          st[strongs] = (st[strongs] ?? 0) + 1
        }
      }
    } else {
      ;(n.c ?? []).forEach(walk)
    }
  }
  for (const s of d.sentences ?? []) walk(s.tree)
  raw.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse || a.num - b.num)

  // Flatten, recording where each verse starts in the token stream.
  const w = []
  const v = []
  let curCh = -1, curV = -1
  for (const t of raw) {
    if (t.chapter !== curCh || t.verse !== curV) {
      v.push([t.chapter, t.verse, w.length])
      curCh = t.chapter; curV = t.verse
    }
    w.push(t.row)
  }
  books[osis] = { w, v }
  wordCount += w.length
}

const json = JSON.stringify({ version: 2, books })
const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 })
fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'construct-index.json.gz'), gz)

const verseCount = Object.values(books).reduce((n, b) => n + b.v.length, 0)
console.log(`books: ${Object.keys(books).length} · verses: ${verseCount} · words: ${wordCount} · ${(gz.length / 1e6).toFixed(2)} MB gz (${(json.length / 1e6).toFixed(1)} MB raw)`)

// ─── lemma → the forms it is actually attested in ─────────────────────────────
// Mirrors MORPH_GROUPS in src/lib/morph-features.ts (this script is standalone node, so the
// vocabulary is repeated here — keep the two in step).
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

// Mirrors POS_CATEGORIES in src/lib/morph-features.ts — which categories each part of speech
// can take at all (keep the two in step).
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

// Pure attestation (count >= 1): a value is offered if the corpus ever tags this lemma that way.
// No frequency threshold — pruning rare-but-real forms would make a legitimate search
// unexpressible, and this corpus is hand-tagged, so stray values are not a real problem.
// Thayer's opening clause makes a serviceable one-line gloss ("I come, go" for ἔρχομαι). Missing
// lexicon entries fall back to the corpus's commonest gloss for the lemma.
const lexicon = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'greek-lexicon.json'), 'utf8'))
const shortGloss = s => {
  if (!s) return ''
  const first = String(s).trim().split(/[;.]/)[0].trim()
  return first.length > 32 ? first.slice(0, 30).replace(/[,\s]+\S*$/, '') + '…' : first
}

const lemmaForms = {}
let singlePos = 0, fixedGender = 0, lexGloss = 0
for (const lemma in lemmaPosCounts) {
  const entry = {}
  // Parts of speech this lemma is attested as, commonest first. One → not a question at all.
  entry.p = Object.entries(lemmaPosCounts[lemma]).sort((a, b) => b[1] - a[1]).map(([p]) => p)
  // For the predictive dropdown: commonest spelling (accented), commonest gloss, frequency.
  const topOf = counts => (counts ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : '')
  const spelling = topOf(lemmaSpellingCounts[lemma])
  if (spelling && spelling !== lemma) entry.d = spelling
  const strongs = topOf(lemmaStrongsCounts[lemma])
  const fromLexicon = strongs ? shortGloss(lexicon[`G${strongs}`]?.thayer) : ''
  if (fromLexicon) lexGloss++
  const gloss = fromLexicon || topOf(lemmaGlossCounts[lemma])
  if (gloss) entry.g = gloss
  entry.n = lemmaTotals[lemma] ?? 0
  if (entry.p.length === 1) singlePos++
  const feats = lemmaFeatCounts[lemma] ?? {}
  // The categories any of this lemma's attested parts of speech could take. Recording a category
  // as EMPTY within that set is what lets the reader hide it: ἵνα is tagged conjunction or
  // adverb, so "degree" is on the table in principle but never actually occurs, and offering it
  // would only ever return nothing. Categories outside this set are simply absent.
  const relevant = new Set(entry.p.flatMap(p => POS_CATEGORIES[p] ?? []))
  for (const [cat, values] of Object.entries(CATEGORIES)) {
    const seen = values.filter(v => feats[v])
    // Only worth recording when it NARROWS the category — absent means "no restriction".
    if (seen.length < values.length && (seen.length > 0 || relevant.has(cat))) entry[cat] = seen
  }
  if (entry.gender?.length === 1) fixedGender++
  lemmaForms[lemma] = entry
}
const formsFile = path.join(process.cwd(), 'public', 'data', 'lemma-forms.json')
fs.writeFileSync(formsFile, JSON.stringify(lemmaForms))
// The old pos-only file is superseded by this one.
fs.rmSync(path.join(process.cwd(), 'public', 'data', 'lemma-pos.json'), { force: true })
console.log(`lemma forms: ${Object.keys(lemmaForms).length} lemmas · ${singlePos} with a single part of speech · ${fixedGender} with a fixed gender · ${lexGloss} lexicon glosses · ${(fs.statSync(formsFile).size / 1024).toFixed(0)} KB`)
