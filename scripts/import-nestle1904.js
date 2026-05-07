#!/usr/bin/env node
/**
 * Downloads and processes the Nestle 1904 GNT (biblicalhumanities/Nestle1904)
 * into per-chapter JSON files suitable for the seminary reader.
 *
 * Output:
 *   public/data/na1904/{osisId}_{ch}.json  — one file per chapter
 *   public/data/books.json                 — updated with na1904 key
 *
 * Usage:
 *   node scripts/import-nestle1904.js
 */

const fs   = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const OUT  = path.join(ROOT, 'public', 'data')

// ─── helpers ─────────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const req = https.get(url, { timeout: 120000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchUrl(res.headers.location).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout: ' + url)) })
  })
}

function stripPunct(s) {
  return s.replace(/[.,;·:!?"'()\[\]{}⸀⸂⸃⟦⟧—–‐]+$/, '')
          .replace(/^[.,;·:!?"'()\[\]{}⸀⸂⸃⟦⟧—–‐]+/, '')
          .trim()
}

// ─── Morphology tables (same as build-reader-data.js) ────────────────────────

const GNT_POS = {
  N:'Noun', V:'Verb', A:'Adjective', T:'Article', ADV:'Adverb',
  PREP:'Preposition', CONJ:'Conjunction', PRT:'Particle', COND:'Conditional',
  INJ:'Interjection', ARAM:'Aramaic', HEB:'Hebrew',
  D:'Demonstrative', P:'Personal Pronoun', R:'Relative Pronoun',
  C:'Reciprocal Pronoun', K:'Correlative Pronoun', I:'Interrogative Pronoun',
  X:'Indefinite Pronoun', Q:'Pronoun', F:'Reflexive Pronoun', S:'Possessive Pronoun',
}
const GNT_CASE  = { N:'Nominative', G:'Genitive', D:'Dative', A:'Accusative', V:'Vocative' }
const GNT_NUM   = { S:'Singular', P:'Plural' }
const GNT_GEN   = { M:'Masculine', F:'Feminine', N:'Neuter' }
const GNT_TENSE = { P:'Present', I:'Imperfect', F:'Future', A:'Aorist', R:'Perfect', L:'Pluperfect',
                    '2A':'2nd Aorist', '2F':'2nd Future', '2R':'2nd Perfect', '2L':'2nd Pluperfect' }
const GNT_VOICE = { A:'Active', M:'Middle', P:'Passive', E:'Middle/Passive', D:'Middle', O:'Passive', N:'Deponent' }
const GNT_MOOD  = { I:'Indicative', S:'Subjunctive', O:'Optative', M:'Imperative', N:'Infinitive', P:'Participle' }

function parseMorph(code) {
  const r = { partOfSpeech:'', casus:null, number:null, gender:null,
              tense:null, voice:null, mood:null, person:null }

  if (!code) return r
  if (GNT_POS[code]) { r.partOfSpeech = GNT_POS[code]; return r }

  const parts = code.split('-')
  const pos0  = parts[0]

  if (pos0 === 'V') {
    r.partOfSpeech = 'Verb'
    if (parts[1]) {
      const tvm = parts[1]
      let i = 0
      const tenseKey = tvm[0] === '2' ? tvm.slice(0, 2) : tvm[0]
      i += tenseKey.length
      const voiceKey = tvm[i++]
      const moodKey  = tvm[i]
      r.tense = GNT_TENSE[tenseKey] || tenseKey
      r.voice = GNT_VOICE[voiceKey] || voiceKey
      r.mood  = GNT_MOOD[moodKey]   || moodKey
      if (moodKey === 'P' && parts[2]) {
        const c = parts[2]
        r.casus  = GNT_CASE[c[0]] || c[0]
        r.number = GNT_NUM[c[1]]  || c[1]
        r.gender = GNT_GEN[c[2]]  || c[2]
      } else if (moodKey !== 'N' && parts[2]) {
        r.person = parts[2][0]
        r.number = GNT_NUM[parts[2][1]] || parts[2][1]
      }
    }
  } else {
    r.partOfSpeech = GNT_POS[pos0] || pos0
    if (parts[1]) {
      const c = parts[1]
      r.casus  = GNT_CASE[c[0]] || c[0]
      r.number = GNT_NUM[c[1]]  || c[1]
      r.gender = GNT_GEN[c[2]]  || c[2]
    }
  }
  return r
}

// ─── Book list ────────────────────────────────────────────────────────────────

// [ filename, osisId, displayName, totalChapters ]
const BOOKS = [
  ['matthew',        'Matt',   'Matthew',         28],
  ['mark',           'Mark',   'Mark',             16],
  ['luke',           'Luke',   'Luke',             24],
  ['john',           'John',   'John',             21],
  ['acts',           'Acts',   'Acts',             28],
  ['romans',         'Rom',    'Romans',           16],
  ['1corinthians',   '1Cor',   '1 Corinthians',    16],
  ['2corinthians',   '2Cor',   '2 Corinthians',    13],
  ['galatians',      'Gal',    'Galatians',         6],
  ['ephesians',      'Eph',    'Ephesians',          6],
  ['philippians',    'Phil',   'Philippians',        4],
  ['colossians',     'Col',    'Colossians',         4],
  ['1thessalonians', '1Thess', '1 Thessalonians',    5],
  ['2thessalonians', '2Thess', '2 Thessalonians',    3],
  ['1timothy',       '1Tim',   '1 Timothy',          6],
  ['2timothy',       '2Tim',   '2 Timothy',          4],
  ['titus',          'Titus',  'Titus',              3],
  ['philemon',       'Phlm',   'Philemon',           1],
  ['hebrews',        'Heb',    'Hebrews',           13],
  ['james',          'Jas',    'James',              5],
  ['1peter',         '1Pet',   '1 Peter',            5],
  ['2peter',         '2Pet',   '2 Peter',            3],
  ['1john',          '1John',  '1 John',             5],
  ['2john',          '2John',  '2 John',             1],
  ['3john',          '3John',  '3 John',             1],
  ['jude',           'Jude',   'Jude',               1],
  ['revelation',     'Rev',    'Revelation',        22],
]

const BASE_URL = 'https://raw.githubusercontent.com/biblicalhumanities/Nestle1904/master/morphology/'

// ─── XML attribute extractor ──────────────────────────────────────────────────

function getAttr(attrStr, name) {
  const re = new RegExp(`${name}="([^"]*)"`)
  const m  = re.exec(attrStr)
  return m ? m[1] : ''
}

// ─── Parse the word id: n{BB}{CCC}{VVV}{WWW} ─────────────────────────────────
// e.g. n40001001001 → book=40, chapter=1, verse=1, word=1

function parseWordId(id) {
  // id format: n40001001001
  if (!id || id.length < 12) return null
  const digits = id.slice(1)   // remove leading 'n'
  const bookNum = parseInt(digits.slice(0, 2), 10)
  const chapter = parseInt(digits.slice(2, 5), 10)
  const verse   = parseInt(digits.slice(5, 8), 10)
  const wordPos = parseInt(digits.slice(8, 11), 10)
  return { bookNum, chapter, verse, wordPos }
}

// ─── Process one book XML ─────────────────────────────────────────────────────

function parseBookXml(xml, osisId, bookName) {
  // Map: chapter → verse → words[]
  const chapters = new Map()

  const wordRe = /<w\s([^>]*)>([^<]*)<\/w>/g
  let match
  let position = 0

  while ((match = wordRe.exec(xml)) !== null) {
    const attrStr = match[1]
    const surface = match[2].trim()

    const id      = getAttr(attrStr, 'id')
    const morph   = getAttr(attrStr, 'morph')
    const lemma   = getAttr(attrStr, 'lemma')

    const parsed  = parseWordId(id)
    if (!parsed) continue

    const { chapter, verse, wordPos } = parsed
    position++

    if (!chapters.has(chapter)) chapters.set(chapter, new Map())
    const verseMap = chapters.get(chapter)
    if (!verseMap.has(verse)) verseMap.set(verse, [])

    const wordSurface = stripPunct(surface) || surface

    verseMap.get(verse).push({
      id,
      position: wordPos,
      surface: wordSurface,
      lemma: lemma || wordSurface,
      strongs: '',
      morph: parseMorph(morph),
    })
  }

  return chapters
}

// ─── Write chapter JSON files ─────────────────────────────────────────────────

function writeChapters(chapters, osisId, bookName, outDir) {
  for (const [chNum, verseMap] of chapters.entries()) {
    const verses = []
    for (const [vNum, words] of [...verseMap.entries()].sort((a, b) => a[0] - b[0])) {
      const verseId  = `${osisId}.${chNum}.${vNum}`
      const text     = words.map(w => w.surface).join(' ')
      verses.push({
        id: verseId,
        bookId: osisId,
        chapter: chNum,
        verse: vNum,
        reference: `${bookName} ${chNum}:${vNum}`,
        text,
        words: words.map(w => ({ ...w, verseId })),
      })
    }

    const out = {
      book: osisId,
      chapter: chNum,
      verses,
    }

    const fileName = path.join(outDir, `${osisId}_${chNum}.json`)
    fs.writeFileSync(fileName, JSON.stringify(out))
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const na1904Dir = path.join(OUT, 'na1904')
  if (!fs.existsSync(na1904Dir)) {
    fs.mkdirSync(na1904Dir, { recursive: true })
    console.log('Created directory:', na1904Dir)
  }

  const bookIndex = []

  for (const [filename, osisId, bookName, totalChapters] of BOOKS) {
    const url = `${BASE_URL}${filename}.xml`
    console.log(`Fetching ${bookName} (${filename}.xml)…`)

    let xml
    try {
      xml = await fetchUrl(url)
    } catch (err) {
      console.error(`  ERROR fetching ${url}:`, err.message)
      continue
    }

    console.log(`  Parsing ${bookName}…`)
    const chapters = parseBookXml(xml, osisId, bookName)

    console.log(`  Writing ${chapters.size} chapters…`)
    writeChapters(chapters, osisId, bookName, na1904Dir)

    bookIndex.push({
      id: osisId,
      corpus: 'NA1904',
      osisId,
      name: bookName,
      abbrev: osisId,
      totalChapters,
    })

    console.log(`  Done: ${bookName}`)
  }

  // Update books.json
  const booksPath = path.join(OUT, 'books.json')
  let booksJson = {}
  if (fs.existsSync(booksPath)) {
    try {
      booksJson = JSON.parse(fs.readFileSync(booksPath, 'utf8'))
    } catch {
      booksJson = {}
    }
  }
  booksJson.na1904 = bookIndex
  fs.writeFileSync(booksPath, JSON.stringify(booksJson, null, 2))
  console.log(`\nUpdated books.json with ${bookIndex.length} NA1904 books.`)
  console.log('Done!')
}

main().catch(err => { console.error(err); process.exit(1) })
