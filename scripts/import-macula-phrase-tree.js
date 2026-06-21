#!/usr/bin/env node
/**
 * Builds NESTED phrase/clause syntax trees from the Macula Greek Nestle 1904
 * lowfat XML (Clear-Bible/macula-greek, CC BY 4.0) for the Phrase Explorer.
 *
 * The existing import-macula-syntax.js flattens the tree to per-word tags; this
 * keeps the hierarchy (sentence → clause → phrase → word). Output is one file
 * per book so the client only loads the book it needs.
 *
 * Source: https://github.com/Clear-Bible/macula-greek/tree/main/Nestle1904/lowfat
 * Output: public/data/phrase-tree/<OsisId>.json
 * Attribution required by CC BY 4.0: "MACULA Greek Linguistic Datasets,
 *   available at https://github.com/Clear-Bible/macula-greek/"
 *
 * Usage: node scripts/import-macula-phrase-tree.js
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const OUT_DIR = path.join(__dirname, '..', 'public', 'data', 'phrase-tree')
const BASE_URL = 'https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/Nestle1904/lowfat/'
const ATTRIBUTION = 'MACULA Greek Linguistic Datasets (CC BY 4.0), https://github.com/Clear-Bible/macula-greek/'

const FILES = [
  '01-matthew', '02-mark', '03-luke', '04-john', '05-acts', '06-romans',
  '07-1corinthians', '08-2corinthians', '09-galatians', '10-ephesians',
  '11-philippians', '12-colossians', '13-1thessalonians', '14-2thessalonians',
  '15-1timothy', '16-2timothy', '17-titus', '18-philemon', '19-hebrews',
  '20-james', '21-1peter', '22-2peter', '23-1john', '24-2john', '25-3john',
  '26-jude', '27-revelation',
]

const BOOK_NUM_TO_OSIS = {
  40: 'Matt', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts', 45: 'Rom',
  46: '1Cor', 47: '2Cor', 48: 'Gal', 49: 'Eph', 50: 'Phil', 51: 'Col',
  52: '1Thess', 53: '2Thess', 54: '1Tim', 55: '2Tim', 56: 'Titus', 57: 'Phlm',
  58: 'Heb', 59: 'Jas', 60: '1Pet', 61: '2Pet', 62: '1John', 63: '2John',
  64: '3John', 65: 'Jude', 66: 'Rev',
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    https.get(url, { timeout: 180000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchUrl(res.headers.location).then(resolve, reject)
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    }).on('error', reject)
  })
}

const attr = (s, n) => {
  const m = new RegExp(`(?:^|\\s)${n.replace(':', '\\:')}="([^"]*)"`).exec(s)
  return m ? m[1] : ''
}

// Build a verbose parsing label from MACULA's morphology attributes, matching the
// Reader's formatParsing output (e.g. "Verb, Aorist, Active, Indicative, 3 person, Singular").
const POS_LABEL = {
  verb: 'Verb', noun: 'Noun', prep: 'Preposition', adj: 'Adjective', adv: 'Adverb',
  det: 'Article', pron: 'Pronoun', conj: 'Conjunction', ptcl: 'Particle', num: 'Number',
  intj: 'Interjection', x: '', name: 'Noun (proper)',
}
const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const personNum = (p) => ({ first: '1', second: '2', third: '3' }[p] || '')
function buildParsing(a) {
  const cls = attr(a, 'class')
  const parts = [POS_LABEL[cls] ?? titleCase(cls)].filter(Boolean)
  const push = (v) => { const t = titleCase(v); if (t) parts.push(t) }
  push(attr(a, 'tense'))
  push(attr(a, 'voice'))
  push(attr(a, 'mood'))
  const per = personNum(attr(a, 'person')); if (per) parts.push(`${per} person`)
  push(attr(a, 'number'))
  push(attr(a, 'case'))
  push(attr(a, 'gender'))
  push(attr(a, 'degree'))
  return parts.join(', ')
}

// xml:id n43001001001 → { book, chapter, verse, word }
function parseId(xmlId) {
  const d = xmlId.replace(/^n/, '')
  if (d.length < 11) return null
  return { book: +d.slice(0, 2), chapter: +d.slice(2, 5), verse: +d.slice(5, 8), word: +d.slice(8, 11) }
}

function build(xml) {
  const re = /<sentence>|<\/sentence>|<wg([^>]*)>|<\/wg>|<w([^>]*?)>([^<]*)<\/w>/g
  const sentences = []
  let sentence = null
  let stack = []
  let osis = null
  let m
  while ((m = re.exec(xml)) !== null) {
    const tok = m[0]
    if (tok === '<sentence>') {
      sentence = { root: { t: 'g', c: [] }, chapter: null, minV: Infinity, maxV: -Infinity }
      stack = [sentence.root]
      continue
    }
    if (tok === '</sentence>') {
      if (sentence && sentence.root.c.length) sentences.push(sentence)
      sentence = null; stack = []
      continue
    }
    if (!sentence) continue
    if (tok.startsWith('<wg')) {
      const a = m[1] || ''
      const node = { t: 'g', cls: attr(a, 'class'), role: attr(a, 'role'), rule: attr(a, 'rule'), c: [] }
      stack[stack.length - 1].c.push(node)
      stack.push(node)
      continue
    }
    if (tok === '</wg>') { stack.pop(); continue }
    const a = m[2] || ''
    const text = m[3] || ''
    const id = parseId(attr(a, 'xml:id') || attr(a, 'id'))
    if (!id) continue
    osis = osis || BOOK_NUM_TO_OSIS[id.book]
    if (sentence.chapter === null) sentence.chapter = id.chapter
    sentence.minV = Math.min(sentence.minV, id.verse)
    sentence.maxV = Math.max(sentence.maxV, id.verse)
    stack[stack.length - 1].c.push({
      t: 'w',
      id: `${BOOK_NUM_TO_OSIS[id.book]}.${id.chapter}.${id.verse}.${id.word}`,
      w: text,
      gloss: attr(a, 'gloss'),
      lemma: attr(a, 'lemma'),
      morph: attr(a, 'morph'),
      role: attr(a, 'role'),
      cls: attr(a, 'class'),
      strongs: attr(a, 'strong'),
      parsing: buildParsing(a),
    })
  }
  return { osis, sentences }
}

function clean(node) {
  if (node.t === 'g') {
    const o = { t: 'g', c: node.c.map(clean) }
    for (const k of ['cls', 'role', 'rule']) if (node[k]) o[k] = node[k]
    return o
  }
  const o = { t: 'w', id: node.id, w: node.w }
  for (const k of ['gloss', 'lemma', 'morph', 'role', 'cls', 'strongs', 'parsing']) if (node[k]) o[k] = node[k]
  return o
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let totalBytes = 0
  for (const file of FILES) {
    process.stdout.write(`${file} … `)
    const xml = await fetchUrl(BASE_URL + file + '.xml')
    const { osis, sentences } = build(xml)
    const out = {
      book: osis,
      attribution: ATTRIBUTION,
      sentences: sentences.map(s => ({
        chapter: s.chapter,
        startVerse: s.minV,
        endVerse: s.maxV,
        ref: s.minV === s.maxV ? `${osis} ${s.chapter}:${s.minV}` : `${osis} ${s.chapter}:${s.minV}–${s.maxV}`,
        tree: clean(s.root),
      })),
    }
    const dest = path.join(OUT_DIR, `${osis}.json`)
    fs.writeFileSync(dest, JSON.stringify(out))
    const bytes = fs.statSync(dest).size
    totalBytes += bytes
    console.log(`${osis}: ${sentences.length} sentences, ${(bytes / 1024).toFixed(0)} KB`)
  }
  // Remove the old single-file prototype output if present.
  const legacy = path.join(__dirname, '..', 'public', 'data', 'phrase-tree-john.json')
  if (fs.existsSync(legacy)) fs.unlinkSync(legacy)
  console.log(`Total: ${(totalBytes / 1024 / 1024).toFixed(1)} MB across ${FILES.length} books`)
}
main().catch(e => { console.error(e); process.exit(1) })
