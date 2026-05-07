#!/usr/bin/env node
/**
 * Downloads and processes the complete GNT (Tischendorf) and LXX (Rahlfs 1935)
 * into per-chapter JSON files suitable for the seminary reader.
 *
 * Output:
 *   public/data/books.json          — book index
 *   public/data/gnt/{book}_{ch}.json
 *   public/data/lxx/{book}_{ch}.json
 */

const fs   = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const OUT  = path.join(ROOT, 'public', 'data')

// ─── helpers ─────────────────────────────────────────────────────────────────

function fetch(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const req = https.get(url, { timeout: 60000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetch(res.headers.location).then(resolve).catch(reject)
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
  // Remove trailing/leading Greek punctuation, commas, periods, brackets
  return s.replace(/[.,;·:!?"'()\[\]{}⸀⸂⸃⟦⟧—–‐]+$/, '')
          .replace(/^[.,;·:!?"'()\[\]{}⸀⸂⸃⟦⟧—–‐]+/, '')
          .trim()
}

// ─── GNT morphology (Tischendorf codes) ──────────────────────────────────────

const GNT_POS = {
  N:'Noun', V:'Verb', A:'Adjective', T:'Article', ADV:'Adverb',
  PREP:'Preposition', CONJ:'Conjunction', PRT:'Particle', COND:'Conditional',
  INJ:'Interjection', ARAM:'Aramaic', HEB:'Hebrew',
  D:'Demonstrative', P:'Personal Pronoun', R:'Relative Pronoun',
  C:'Reciprocal Pronoun', K:'Correlative Pronoun', I:'Interrogative Pronoun',
  X:'Indefinite Pronoun', Q:'Pronoun', F:'Reflexive Pronoun', S:'Possessive Pronoun',
}
const GNT_CASE   = { N:'Nominative', G:'Genitive', D:'Dative', A:'Accusative', V:'Vocative' }
const GNT_NUM    = { S:'Singular', P:'Plural' }
const GNT_GEN    = { M:'Masculine', F:'Feminine', N:'Neuter' }
const GNT_TENSE  = { P:'Present', I:'Imperfect', F:'Future', A:'Aorist', R:'Perfect', L:'Pluperfect',
                     '2A':'2nd Aorist', '2F':'2nd Future', '2R':'2nd Perfect', '2L':'2nd Pluperfect' }
const GNT_VOICE  = { A:'Active', M:'Middle', P:'Passive', E:'Middle/Passive', D:'Middle', O:'Passive', N:'Deponent' }
const GNT_MOOD   = { I:'Indicative', S:'Subjunctive', O:'Optative', M:'Imperative', N:'Infinitive', P:'Participle' }

function parseGNTMorph(code) {
  const r = { partOfSpeech:'', casus:null, number:null, gender:null,
              tense:null, voice:null, mood:null, person:null }

  if (GNT_POS[code]) { r.partOfSpeech = GNT_POS[code]; return r }

  const parts = code.split('-')
  const pos0 = parts[0]

  if (pos0 === 'V') {
    r.partOfSpeech = 'Verb'
    if (parts[1]) {
      const tvm = parts[1]
      let i = 0
      const tenseKey = tvm[0] === '2' ? tvm.slice(0,2) : tvm[0]
      i += tenseKey.length
      const voiceKey = tvm[i++]
      const moodKey  = tvm[i]
      r.tense = GNT_TENSE[tenseKey] || tenseKey
      r.voice = GNT_VOICE[voiceKey] || voiceKey
      r.mood  = GNT_MOOD[moodKey]  || moodKey
      if (moodKey === 'P' && parts[2]) {          // participle → case/num/gen
        const c = parts[2]
        r.casus  = GNT_CASE[c[0]] || c[0]
        r.number = GNT_NUM[c[1]]  || c[1]
        r.gender = GNT_GEN[c[2]]  || c[2]
      } else if (moodKey !== 'N' && parts[2]) {   // finite verb → person/num
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

// ─── LXX morphology (lxx.POS[.DETAILS] codes) ────────────────────────────────

const LXX_POS = {
  N:'Noun', V:'Verb', A:'Adjective', RA:'Article', RD:'Demonstrative',
  RI:'Interrogative Pronoun', RX:'Indefinite Pronoun', RR:'Relative Pronoun',
  PP:'Personal Pronoun', P:'Preposition', C:'Conjunction', D:'Adverb',
  X:'Particle', I:'Interjection', T:'Article',
}
const LXX_TENSE = { A:'Aorist', P:'Present', I:'Imperfect', F:'Future', R:'Perfect', L:'Pluperfect' }
const LXX_VOICE = { A:'Active', M:'Middle', P:'Passive' }
const LXX_MOOD  = { I:'Indicative', D:'Imperative', S:'Subjunctive', O:'Optative', N:'Infinitive', P:'Participle' }

function parseLXXMorph(raw) {
  // raw is like "lxx.N.DSF" or "lxx.V.AAI3S" or "lxx.P"
  const r = { partOfSpeech:'', casus:null, number:null, gender:null,
              tense:null, voice:null, mood:null, person:null }
  const code = raw.startsWith('lxx.') ? raw.slice(4) : raw
  const dots  = code.split('.')
  const pos0  = dots[0]

  r.partOfSpeech = LXX_POS[pos0] || pos0

  if (!dots[1]) return r   // e.g. lxx.P, lxx.C, lxx.D

  const detail = dots[1]

  if (pos0 === 'V') {
    // detail like "AAI3S", "IMI3S", "APD3S", "PAN", "PAPNSM"
    if (detail.length >= 3) {
      r.tense = LXX_TENSE[detail[0]] || detail[0]
      r.voice = LXX_VOICE[detail[1]] || detail[1]
      r.mood  = LXX_MOOD[detail[2]]  || detail[2]
      if (detail[2] === 'P' && detail.length > 3) {     // participle
        r.casus  = GNT_CASE[detail[3]] || detail[3]
        r.number = GNT_NUM[detail[4]]  || detail[4]
        r.gender = GNT_GEN[detail[5]]  || detail[5]
      } else if (detail[2] !== 'N' && detail.length > 3) { // finite
        r.person = detail[3]
        r.number = GNT_NUM[detail[4]] || detail[4]
      }
    }
  } else {
    // nominal: detail like "NSM", "DSF", "GSN"
    if (detail.length >= 2) {
      r.casus  = GNT_CASE[detail[0]] || detail[0]
      r.number = GNT_NUM[detail[1]]  || detail[1]
      r.gender = GNT_GEN[detail[2]]  || detail[2]
    }
  }
  return r
}

// ─── GNT book metadata ────────────────────────────────────────────────────────

const GNT_BOOKS = [
  { file:'MT',  osisId:'Matt',  name:'Matthew',           abbrev:'Matt', chapters:28 },
  { file:'MR',  osisId:'Mark',  name:'Mark',              abbrev:'Mark', chapters:16 },
  { file:'LU',  osisId:'Luke',  name:'Luke',              abbrev:'Luke', chapters:24 },
  { file:'JOH', osisId:'John',  name:'John',              abbrev:'John', chapters:21 },
  { file:'AC',  osisId:'Acts',  name:'Acts',              abbrev:'Acts', chapters:28 },
  { file:'RO',  osisId:'Rom',   name:'Romans',            abbrev:'Rom',  chapters:16 },
  { file:'1CO', osisId:'1Cor',  name:'1 Corinthians',     abbrev:'1Cor', chapters:16 },
  { file:'2CO', osisId:'2Cor',  name:'2 Corinthians',     abbrev:'2Cor', chapters:13 },
  { file:'GA',  osisId:'Gal',   name:'Galatians',         abbrev:'Gal',  chapters:6  },
  { file:'EPH', osisId:'Eph',   name:'Ephesians',         abbrev:'Eph',  chapters:6  },
  { file:'PHP', osisId:'Phil',  name:'Philippians',       abbrev:'Phil', chapters:4  },
  { file:'COL', osisId:'Col',   name:'Colossians',        abbrev:'Col',  chapters:4  },
  { file:'1TH', osisId:'1Thess',name:'1 Thessalonians',   abbrev:'1Th',  chapters:5  },
  { file:'2TH', osisId:'2Thess',name:'2 Thessalonians',   abbrev:'2Th',  chapters:3  },
  { file:'1TI', osisId:'1Tim',  name:'1 Timothy',         abbrev:'1Tim', chapters:6  },
  { file:'2TI', osisId:'2Tim',  name:'2 Timothy',         abbrev:'2Tim', chapters:4  },
  { file:'TIT', osisId:'Titus', name:'Titus',             abbrev:'Tit',  chapters:3  },
  { file:'PHM', osisId:'Phlm',  name:'Philemon',          abbrev:'Phm',  chapters:1  },
  { file:'HEB', osisId:'Heb',   name:'Hebrews',           abbrev:'Heb',  chapters:13 },
  { file:'JAS', osisId:'Jas',   name:'James',             abbrev:'Jas',  chapters:5  },
  { file:'1PE', osisId:'1Pet',  name:'1 Peter',           abbrev:'1Pet', chapters:5  },
  { file:'2PE', osisId:'2Pet',  name:'2 Peter',           abbrev:'2Pet', chapters:3  },
  { file:'1JO', osisId:'1John', name:'1 John',            abbrev:'1Jn',  chapters:5  },
  { file:'2JO', osisId:'2John', name:'2 John',            abbrev:'2Jn',  chapters:1  },
  { file:'3JO', osisId:'3John', name:'3 John',            abbrev:'3Jn',  chapters:1  },
  { file:'JUDE',osisId:'Jude',  name:'Jude',              abbrev:'Jude', chapters:1  },
  { file:'RE',  osisId:'Rev',   name:'Revelation',        abbrev:'Rev',  chapters:22 },
]

// ─── LXX book metadata (from books_main.csv numeric IDs) ─────────────────────

const LXX_BOOKS_META = {
  10:  { osisId:'Gen',     name:'Genesis',             abbrev:'Gen',   chapters:50 },
  20:  { osisId:'Exod',    name:'Exodus',              abbrev:'Exod',  chapters:40 },
  30:  { osisId:'Lev',     name:'Leviticus',           abbrev:'Lev',   chapters:27 },
  40:  { osisId:'Num',     name:'Numbers',             abbrev:'Num',   chapters:36 },
  50:  { osisId:'Deut',    name:'Deuteronomy',         abbrev:'Deut',  chapters:34 },
  60:  { osisId:'JoshB',   name:'Joshua',              abbrev:'Josh',  chapters:24 },
  70:  { osisId:'JudgB',   name:'Judges',              abbrev:'Judg',  chapters:21 },
  80:  { osisId:'Ruth',    name:'Ruth',                abbrev:'Ruth',  chapters:4  },
  90:  { osisId:'1Sam',    name:'1 Samuel',            abbrev:'1Sam',  chapters:31 },
  100: { osisId:'2Sam',    name:'2 Samuel',            abbrev:'2Sam',  chapters:24 },
  110: { osisId:'1Kgs',    name:'1 Kings',             abbrev:'1Kgs',  chapters:22 },
  120: { osisId:'2Kgs',    name:'2 Kings',             abbrev:'2Kgs',  chapters:25 },
  130: { osisId:'1Chr',    name:'1 Chronicles',        abbrev:'1Chr',  chapters:29 },
  140: { osisId:'2Chr',    name:'2 Chronicles',        abbrev:'2Chr',  chapters:36 },
  155: { osisId:'1Esd',    name:'1 Esdras',            abbrev:'1Esd',  chapters:9  },
  165: { osisId:'Ezra',    name:'Ezra',                abbrev:'Ezra',  chapters:10 },
  170: { osisId:'Neh',     name:'Nehemiah',            abbrev:'Neh',   chapters:13 },
  175: { osisId:'Tob',     name:'Tobit',               abbrev:'Tob',   chapters:14 },
  180: { osisId:'Jdt',     name:'Judith',              abbrev:'Jdt',   chapters:16 },
  190: { osisId:'EsthGr',  name:'Esther (Greek)',      abbrev:'Esth',  chapters:10 },
  220: { osisId:'Job',     name:'Job',                 abbrev:'Job',   chapters:42 },
  230: { osisId:'Ps',      name:'Psalms',              abbrev:'Ps',    chapters:151 },
  240: { osisId:'Prov',    name:'Proverbs',            abbrev:'Prov',  chapters:31 },
  245: { osisId:'Eccl',    name:'Ecclesiastes',        abbrev:'Eccl',  chapters:12 },
  250: { osisId:'Song',    name:'Song of Songs',       abbrev:'Song',  chapters:8  },
  260: { osisId:'Wis',     name:'Wisdom of Solomon',   abbrev:'Wis',   chapters:19 },
  270: { osisId:'Sir',     name:'Sirach',              abbrev:'Sir',   chapters:51 },
  290: { osisId:'Isa',     name:'Isaiah',              abbrev:'Isa',   chapters:66 },
  300: { osisId:'Jer',     name:'Jeremiah',            abbrev:'Jer',   chapters:52 },
  305: { osisId:'Bar',     name:'Baruch',              abbrev:'Bar',   chapters:6  },
  310: { osisId:'Lam',     name:'Lamentations',        abbrev:'Lam',   chapters:5  },
  315: { osisId:'EpJer',   name:'Epistle of Jeremiah', abbrev:'EpJer', chapters:1  },
  320: { osisId:'Ezek',    name:'Ezekiel',             abbrev:'Ezek',  chapters:48 },
  325: { osisId:'DanLXX',  name:'Daniel (LXX)',        abbrev:'Dan',   chapters:14 },
  350: { osisId:'Hos',     name:'Hosea',               abbrev:'Hos',   chapters:14 },
  360: { osisId:'Joel',    name:'Joel',                abbrev:'Joel',  chapters:4  },
  370: { osisId:'Amos',    name:'Amos',                abbrev:'Amos',  chapters:9  },
  375: { osisId:'Obad',    name:'Obadiah',             abbrev:'Obad',  chapters:1  },
  380: { osisId:'Jonah',   name:'Jonah',               abbrev:'Jonah', chapters:4  },
  390: { osisId:'Mic',     name:'Micah',               abbrev:'Mic',   chapters:7  },
  395: { osisId:'Nah',     name:'Nahum',               abbrev:'Nah',   chapters:3  },
  400: { osisId:'Hab',     name:'Habakkuk',            abbrev:'Hab',   chapters:3  },
  405: { osisId:'Zeph',    name:'Zephaniah',           abbrev:'Zeph',  chapters:3  },
  410: { osisId:'Hag',     name:'Haggai',              abbrev:'Hag',   chapters:2  },
  420: { osisId:'Zech',    name:'Zechariah',           abbrev:'Zech',  chapters:14 },
  430: { osisId:'Mal',     name:'Malachi',             abbrev:'Mal',   chapters:4  },
  462: { osisId:'1Macc',   name:'1 Maccabees',         abbrev:'1Macc', chapters:16 },
  464: { osisId:'2Macc',   name:'2 Maccabees',         abbrev:'2Macc', chapters:15 },
  466: { osisId:'3Macc',   name:'3 Maccabees',         abbrev:'3Macc', chapters:7  },
  467: { osisId:'4Macc',   name:'4 Maccabees',         abbrev:'4Macc', chapters:18 },
  800: { osisId:'Odes',    name:'Odes',                abbrev:'Odes',  chapters:14 },
}

// ─── Parse a single GNT book text file ───────────────────────────────────────

function parseGNTBook(text, bookMeta) {
  // Map: chapter → verse → words[]
  const chapters = {}

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const fields = line.split(' ')
    if (fields.length < 7) continue

    // fields: [BOOK, LOC, BREAK, KETHIV, QERE, MORPH, STRONGS, ...LEMMA]
    const loc    = fields[1]   // e.g. "1:1.1"
    const qere   = fields[4]   // recommended reading form
    const morph  = fields[5]
    const strongs= fields[6]
    // Lemma: everything from fields[7] up to (but not including) " ! "
    const lemmaFull = fields.slice(7).join(' ')
    const lemma = lemmaFull.split(' ! ')[0].trim()

    const [chVerse, wordPos] = loc.split('.')
    const [ch, vs] = chVerse.split(':')
    const chapter = parseInt(ch, 10)
    const verse   = parseInt(vs, 10)
    const position= parseInt(wordPos, 10)

    if (!chapters[chapter]) chapters[chapter] = {}
    if (!chapters[chapter][verse]) chapters[chapter][verse] = []

    const surface = stripPunct(qere)
    if (!surface) continue

    const parse = parseGNTMorph(morph)

    chapters[chapter][verse].push({
      id: `${bookMeta.osisId}.${chapter}.${verse}.${position}`,
      position,
      surface,
      lemma,
      strongs,
      morph: parse,
    })
  }

  return chapters
}

// ─── Parse LXX CSV (one row = one verse) ─────────────────────────────────────

// Regex to extract each word token: SURFACE<S>ID</S><m>MORPH</m>[<S>STRONGS</S>...]
const WORD_RE = /([^\s<]+)<S>\d+<\/S><m>([^<]+)<\/m>(?:<S>(\d+)<\/S>)?/g

function parseLXXVerseLine(text) {
  const words = []
  let position = 0
  let match
  WORD_RE.lastIndex = 0
  while ((match = WORD_RE.exec(text)) !== null) {
    position++
    const surface = stripPunct(match[1])
    if (!surface) continue
    const morphRaw = match[2]
    const strongs  = match[3] || ''
    // extract lemma-like info: we don't have a separate lemma in this format,
    // so use surface form normalised
    const parse = parseLXXMorph(morphRaw)
    words.push({ position, surface, lemma: surface, strongs, morph: parse })
  }
  return words
}

function parseLXXCSV(csv, booksMetaMap) {
  // Returns: { bookNum → { chapter → { verse → words[] } } }
  const result = {}
  for (const rawLine of csv.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const tabs = line.split('\t')
    if (tabs.length < 4) continue
    const bookNum = parseInt(tabs[0], 10)
    const chapter = parseInt(tabs[1], 10)
    const verse   = parseInt(tabs[2], 10)
    const text    = tabs[3]
    if (!booksMetaMap[bookNum]) continue
    if (!result[bookNum]) result[bookNum] = {}
    if (!result[bookNum][chapter]) result[bookNum][chapter] = {}
    result[bookNum][chapter][verse] = parseLXXVerseLine(text)
  }
  return result
}

// ─── Write a chapter JSON file ────────────────────────────────────────────────

function makeChapterJSON(bookMeta, chapterNum, verseMap) {
  const verses = Object.entries(verseMap)
    .map(([vs, words]) => {
      const vNum = parseInt(vs, 10)
      const text = words.map(w => w.surface).join(' ')
      // Assign verse-level IDs
      const wordsWithId = words.map(w => ({
        ...w,
        id: w.id || `${bookMeta.osisId}.${chapterNum}.${vNum}.${w.position}`,
        verseId: `${bookMeta.osisId}.${chapterNum}.${vNum}`,
      }))
      return {
        id: `${bookMeta.osisId}.${chapterNum}.${vNum}`,
        bookId: bookMeta.osisId,
        chapter: chapterNum,
        verse: vNum,
        reference: `${bookMeta.name} ${chapterNum}:${vNum}`,
        text,
        words: wordsWithId,
      }
    })
    .sort((a, b) => a.verse - b.verse)

  return { book: bookMeta.osisId, chapter: chapterNum, verses }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Building reader data…\n')

  const GNT_BASE = 'https://raw.githubusercontent.com/morphgnt/tischendorf-data/master/word-per-line/2.8/Unicode/'
  const LXX_CSV_URL = 'https://raw.githubusercontent.com/eliranwong/LXX-Rahlfs-1935/master/11_end-users_files/MyBible/Bibles/LXX_final_main.csv'

  // ── GNT ──────────────────────────────────────────────────────────────────

  const gntBooks = []
  let gntTotal = 0

  for (const bookMeta of GNT_BOOKS) {
    process.stdout.write(`  GNT ${bookMeta.name}… `)
    const url = GNT_BASE + bookMeta.file + '.txt'
    let text
    try { text = await fetch(url) } catch (e) { console.error('FAILED:', e.message); continue }

    const chapters = parseGNTBook(text, bookMeta)
    const chNums   = Object.keys(chapters).map(Number).sort((a, b) => a - b)

    for (const ch of chNums) {
      const data = makeChapterJSON(bookMeta, ch, chapters[ch])
      const outPath = path.join(OUT, 'gnt', `${bookMeta.osisId}_${ch}.json`)
      fs.writeFileSync(outPath, JSON.stringify(data))
      gntTotal += data.verses.length
    }

    gntBooks.push({
      id: bookMeta.osisId,
      corpus: 'GNT',
      osisId: bookMeta.osisId,
      name: bookMeta.name,
      abbrev: bookMeta.abbrev,
      totalChapters: chNums.length || bookMeta.chapters,
    })
    console.log(`${chNums.length} chapters`)
  }

  // ── LXX ──────────────────────────────────────────────────────────────────

  console.log('\n  Downloading LXX CSV (this may take a moment)…')
  let lxxCSV
  try { lxxCSV = await fetch(LXX_CSV_URL) } catch (e) { console.error('LXX download FAILED:', e.message); process.exit(1) }
  console.log(`  Downloaded ${(lxxCSV.length / 1e6).toFixed(1)} MB`)

  const lxxParsed = parseLXXCSV(lxxCSV, LXX_BOOKS_META)
  const lxxBooks  = []
  let lxxTotal    = 0

  for (const [bookNumStr, chapterMap] of Object.entries(lxxParsed)) {
    const bookNum = parseInt(bookNumStr, 10)
    const meta    = LXX_BOOKS_META[bookNum]
    if (!meta) continue

    process.stdout.write(`  LXX ${meta.name}… `)
    const chNums = Object.keys(chapterMap).map(Number).sort((a, b) => a - b)

    for (const ch of chNums) {
      const data = makeChapterJSON(meta, ch, chapterMap[ch])
      const outPath = path.join(OUT, 'lxx', `${meta.osisId}_${ch}.json`)
      fs.writeFileSync(outPath, JSON.stringify(data))
      lxxTotal += data.verses.length
    }

    lxxBooks.push({
      id: meta.osisId,
      corpus: 'LXX',
      osisId: meta.osisId,
      name: meta.name,
      abbrev: meta.abbrev,
      totalChapters: chNums.length || meta.chapters,
    })
    console.log(`${chNums.length} chapters`)
  }

  // ── Books index ───────────────────────────────────────────────────────────

  const booksIndex = { gnt: gntBooks, lxx: lxxBooks }
  fs.writeFileSync(path.join(OUT, 'books.json'), JSON.stringify(booksIndex, null, 2))

  console.log(`
Done!
  GNT: ${gntBooks.length} books, ${gntTotal} verses
  LXX: ${lxxBooks.length} books, ${lxxTotal} verses
  Index: public/data/books.json
`)
}

main().catch(e => { console.error(e); process.exit(1) })
