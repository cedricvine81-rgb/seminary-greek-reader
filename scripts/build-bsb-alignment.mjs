/**
 * Build BSB alignment data for the Greek reader app.
 *
 * Sources:
 *   - OpenGNT_version3_3.csv  (OpenGNT base text, tab-separated)
 *   - bsb_align.csv           (BSB_update_30AUG2018.csv from OpenGNT mapping_BGB)
 *
 * Output: public/data/bsb-alignment.json
 *   {
 *     "Matt.1.1": {
 *       "text": "This is the record of the genealogy ...",
 *       "g2t": { "1": [0,1,2,3], "2": [4,5], ... },  // app word pos → BSB token indices
 *       "t2g": [1, 1, 1, 1, 2, 2, ...]               // BSB token index → app word pos (null = added word)
 *     }
 *   }
 *
 * Usage:
 *   node scripts/build-bsb-alignment.mjs \
 *     --base /tmp/OpenGNT_version3_3.csv \
 *     --bsb  /tmp/bsb_align.csv
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── CLI args ──────────────────────────────────────────────────────────────────

function arg(name) {
  const idx = process.argv.indexOf(name)
  return idx !== -1 ? process.argv[idx + 1] : null
}

const BASE_PATH = arg('--base') ?? '/tmp/OpenGNT_version3_3.csv'
const BSB_PATH  = arg('--bsb')  ?? '/tmp/bsb_align.csv'
const OUT_PATH  = arg('--out')  ??
  path.join(__dirname, '..', 'public', 'data', 'bsb-alignment.json')
const GNT_DIR   = arg('--gnt')  ??
  path.join(__dirname, '..', 'public', 'data', 'gnt')

// ── Book number → OSIS ID ─────────────────────────────────────────────────────

const BOOK_MAP = {
  40: 'Matt', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Rom',  46: '1Cor', 47: '2Cor', 48: 'Gal',  49: 'Eph',
  50: 'Phil', 51: 'Col',  52: '1Thess', 53: '2Thess',
  54: '1Tim', 55: '2Tim', 56: 'Titus', 57: 'Phlm', 58: 'Heb',
  59: 'Jas',  60: '1Pet', 61: '2Pet',  62: '1John', 63: '2John',
  64: '3John', 65: 'Jude', 66: 'Rev',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Strip 〔〕 and split on ｜
function parseGroup(cell) {
  return cell.replace(/[〔〕]/g, '').split('｜')
}

// Remove [bracketed] and {curly} markers but keep the text content, collapse whitespace
function stripBrackets(text) {
  return text
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/\{([^}]*)\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

// Normalize Greek for surface-form matching: strip diacritics, lowercase
function normalizeGreek(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ── App GNT JSON loader ───────────────────────────────────────────────────────

// Cache: "bookOsis_chapter" → Map<verseKey, { surface: string, pos: number }[]>
const _appCache = new Map()

function loadAppVerse(bookOsis, chapter, verseNum) {
  const fileKey = `${bookOsis}_${chapter}`
  if (!_appCache.has(fileKey)) {
    const filePath = path.join(GNT_DIR, `${fileKey}.json`)
    const verseMap = new Map()
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      for (const v of (data.verses || [])) {
        const words = (v.words || []).map(w => ({
          surface: normalizeGreek(w.surface || ''),
          pos: w.position,
        }))
        verseMap.set(v.verse, words)
      }
    } catch {
      // file missing or parse error — leave verseMap empty
    }
    _appCache.set(fileKey, verseMap)
  }
  return _appCache.get(fileKey).get(verseNum) ?? []
}

// Build ogntPos → appPos mapping for a verse using occurrence-order surface matching.
// Returns Map<ogntPos, appPos | null>
function buildPosMap(ogntWords, appWords) {
  // Group app words by normalized surface, in position order
  const appBySurface = new Map()
  for (const w of appWords) {
    if (!appBySurface.has(w.surface)) appBySurface.set(w.surface, [])
    appBySurface.get(w.surface).push(w.pos)
  }

  // Track occurrence index per surface for OpenGNT words
  const ogntOccurrence = new Map()
  const result = new Map()
  for (const w of ogntWords) {
    const occ = ogntOccurrence.get(w.surface) ?? 0
    ogntOccurrence.set(w.surface, occ + 1)
    const appPositions = appBySurface.get(w.surface) ?? []
    result.set(w.ogntPos, appPositions[occ] ?? null)
  }
  return result
}

// ── Step 1: parse base text ───────────────────────────────────────────────────

console.log('Reading base text…')
const baseRaw = fs.readFileSync(BASE_PATH, 'utf8')
const baseLines = baseRaw.split('\n')

// bgbSort → { bookOsis, chapter, verse, ogntPos, surface }
const baseMap = new Map()
const verseCounts = new Map()  // verseKey → running count of words seen

for (let i = 1; i < baseLines.length; i++) {
  const line = baseLines[i]
  if (!line.trim()) continue

  const cols = line.split('\t')
  if (cols.length < 8) continue

  // Column 5: 〔BGBsortI｜LTsortI｜STsortI〕 — use BGBsortI as join key with BSB alignment file
  const sortGroup = parseGroup(cols[5])
  const bgbSort = parseInt(sortGroup[0], 10)
  if (isNaN(bgbSort) || bgbSort <= 0) continue

  const bcv = parseGroup(cols[6])
  const bookNum = parseInt(bcv[0], 10)
  const chapter = parseInt(bcv[1], 10)
  const verse   = parseInt(bcv[2], 10)

  const bookOsis = BOOK_MAP[bookNum]
  if (!bookOsis) continue  // skip OT / apocrypha entries

  // Column 7: 〔OGNTk｜OGNTu｜OGNTa｜lexeme｜rmac｜sn〕
  // OGNTa (index 2) is the accented surface form — matches the app's Tischendorf forms closely
  const ogntGroup = parseGroup(cols[7])
  const surfaceRaw = ogntGroup[2] || ogntGroup[1] || ogntGroup[0] || ''
  const surface = normalizeGreek(surfaceRaw)

  const verseKey = `${bookOsis}.${chapter}.${verse}`
  const ogntPos = (verseCounts.get(verseKey) ?? 0) + 1
  verseCounts.set(verseKey, ogntPos)

  baseMap.set(bgbSort, { bookOsis, chapter, verse, ogntPos, surface })
}

console.log(`  ${baseMap.size} words parsed`)

// ── Step 2: parse BSB alignment ───────────────────────────────────────────────

console.log('Reading BSB alignment…')
const bsbRaw = fs.readFileSync(BSB_PATH, 'utf8')
const bsbLines = bsbRaw.split('\n')

// bgbSort → { bsbSort, bsbText }
const bsbMap = new Map()

for (let i = 1; i < bsbLines.length; i++) {
  const line = bsbLines[i].trim()
  if (!line) continue

  const parts = line.split('\t')
  if (parts.length < 3) continue

  const gkSort  = parseInt(parts[0], 10)
  const bsbSort = parseInt(parts[1], 10)
  const bsbText = parts[2] ?? ''

  if (!isNaN(gkSort)) bsbMap.set(gkSort, { bsbSort, bsbText })
}

console.log(`  ${bsbMap.size} entries parsed`)

// ── Step 3: group by verse (with ogntPos and surface) ────────────────────────

console.log('Grouping by verse…')

// verseKey → [ { ogntPos, surface, bsbSort, bsbText }, ... ]
const verses = new Map()

for (const [bgbSort, wordInfo] of baseMap) {
  const bsbInfo = bsbMap.get(bgbSort)
  if (!bsbInfo) continue

  const verseKey = `${wordInfo.bookOsis}.${wordInfo.chapter}.${wordInfo.verse}`
  if (!verses.has(verseKey)) verses.set(verseKey, [])

  verses.get(verseKey).push({
    ogntPos: wordInfo.ogntPos,
    surface: wordInfo.surface,
    bookOsis: wordInfo.bookOsis,
    chapter: wordInfo.chapter,
    verse: wordInfo.verse,
    bsbSort: bsbInfo.bsbSort,
    bsbText: bsbInfo.bsbText,
  })
}

console.log(`  ${verses.size} verses`)

// ── Step 4: build per-verse alignment using app position mapping ──────────────

console.log('Building alignment…')
const output = {}
let unmatchedWords = 0

for (const [verseKey, ogntWords] of verses) {
  // Load app words for this verse
  const sample = ogntWords[0]
  const appWords = loadAppVerse(sample.bookOsis, sample.chapter, sample.verse)

  // Build ogntPos → appPos mapping
  const posMap = buildPosMap(ogntWords, appWords)

  // Sort by English word order to reconstruct the BSB verse text
  const ordered = [...ogntWords].sort((a, b) => a.bsbSort - b.bsbSort)

  const tokens = []  // { text: string, appPos: number | null }

  for (const w of ordered) {
    const stripped = stripBrackets(w.bsbText)
    if (!stripped || stripped === '-' || stripped === '...' || stripped === 'vvv') continue

    const appPos = posMap.get(w.ogntPos) ?? null
    if (appPos === null) unmatchedWords++

    const parts = stripped.split(/\s+/).filter(Boolean)
    for (const part of parts) {
      tokens.push({ text: part, appPos })
    }
  }

  if (tokens.length === 0) continue

  const text = tokens.map(t => t.text).join(' ')

  // t2g: token index → app word position (null for tokens with no direct source)
  const t2g = tokens.map(t => t.appPos ?? null)

  // g2t: app word position → array of token indices
  const g2t = {}
  for (let i = 0; i < tokens.length; i++) {
    const p = tokens[i].appPos
    if (p != null) {
      if (!g2t[p]) g2t[p] = []
      g2t[p].push(i)
    }
  }

  output[verseKey] = { text, g2t, t2g }
}

// ── Step 5: write output ──────────────────────────────────────────────────────

console.log(`Writing to ${OUT_PATH}…`)
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(output))

const stat = fs.statSync(OUT_PATH)
console.log(`Done — ${Object.keys(output).length} verses, ${(stat.size / 1024 / 1024).toFixed(1)} MB`)
console.log(`  (${unmatchedWords} BSB tokens had no matching app word — expected for textual variants)`)
