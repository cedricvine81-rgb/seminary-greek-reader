// Per-word search index for the SEPTUAGINT: morphology search and Strong's-number search.
//
// WHY THIS IS SEPARATE FROM word-index.json.gz. Two reasons, one of scope and one of cost.
//
// Scope: it could not exist until now. Searching by morphology needs a parse on every word, and
// the Rahlfs data carried none we could use — its `lemma` field held the inflected surface form,
// not a dictionary form. Our own Stanza tagging of Swete gives every word a parse and a Strong's
// number, so "every aorist participle in the Septuagint" is now a question the app can answer.
//
// Cost: the Septuagint is four times the New Testament — 588,000 words against 138,000. Folding
// them into one file would put that on every cold start, including the great majority of searches
// that never leave the New Testament. Kept apart, src/lib/search.ts loads it only when a search
// actually asks for the Septuagint.
//
// Shape matches word-index.json.gz exactly — { [verseId]: [ [strongs, lemmaNorm, parsingLower] ] } —
// and so does the parsing vocabulary, which is what lets one search function serve both corpora.
// The tokens must match src/lib/morph-features.ts: lowercase, comma-separated, and person reads
// "3 person" rather than "3rd".
//
// Usage:  node scripts/build-word-index-lxx.mjs

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const DATA = path.join(process.cwd(), 'public', 'data')
const LETTERS = /[^A-Za-zÀ-ɏͰ-῿]/g
const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Our morph objects use the traditional labels; the search vocabulary is lowercase, and a couple
// of values are spelled differently there.
const POS = {
  Noun: 'noun', Verb: 'verb', Article: 'article', Adjective: 'adjective', Pronoun: 'pronoun',
  Preposition: 'preposition', Conjunction: 'conjunction', Adverb: 'adverb', Particle: 'particle',
  Numeral: 'number', Interjection: 'interjection',
}
const VOICE = { Active: 'active', Middle: 'middle', Passive: 'passive', 'Middle/Passive': 'middlepassive' }

function parsingString(m) {
  if (!m) return ''
  const out = []
  const pos = POS[m.partOfSpeech]
  if (pos) out.push(pos)
  if (m.tense)  out.push(String(m.tense).toLowerCase())
  if (m.voice)  out.push(VOICE[m.voice] ?? String(m.voice).toLowerCase())
  if (m.mood)   out.push(String(m.mood).toLowerCase())
  if (m.person) out.push(`${String(m.person).replace(/\D/g, '')} person`)
  if (m.number) out.push(String(m.number).toLowerCase())
  if (m.casus)  out.push(String(m.casus).toLowerCase())
  if (m.gender) out.push(String(m.gender).toLowerCase())
  return out.join(', ')
}

const books = new Set(JSON.parse(fs.readFileSync(path.join(DATA, 'books.json'), 'utf8')).lxx.map(b => b.osisId))
const byVerse = {}
let words = 0, parsed = 0, withStrongs = 0

for (const file of fs.readdirSync(path.join(DATA, 'lxx')).filter(f => f.endsWith('.json'))) {
  // Skip data files no book entry points at (DanTh/SusTh/BelTh) — a hit there could not be opened.
  if (!books.has(file.slice(0, file.lastIndexOf('_')))) continue
  const doc = JSON.parse(fs.readFileSync(path.join(DATA, 'lxx', file), 'utf8'))
  for (const v of doc.verses) {
    for (const w of v.words) {
      const strongs = w.strongs ? String(w.strongs) : ''
      const parsing = parsingString(w.morph)
      words++
      if (parsing) parsed++
      if (strongs) withStrongs++
      if (!strongs && !parsing) continue
      const lemmaNorm = w.lemma ? normalize(String(w.lemma).replace(LETTERS, '')) : ''
      ;(byVerse[v.id] ??= []).push([strongs, lemmaNorm, parsing])
    }
  }
}

const gz = zlib.gzipSync(Buffer.from(JSON.stringify(byVerse), 'utf8'), { level: 9 })
fs.writeFileSync(path.join(DATA, 'word-index-lxx.json.gz'), gz)
console.log(`word-index-lxx.json.gz: ${Object.keys(byVerse).length} verses · ${words} words · ${(gz.length / 1e6).toFixed(2)} MB gz`)
console.log(`  with a parse: ${parsed} (${(100 * parsed / words).toFixed(1)}%) · with a Strong's number: ${withStrongs} (${(100 * withStrongs / words).toFixed(1)}%)`)
