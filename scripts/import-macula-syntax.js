#!/usr/bin/env node
/**
 * Downloads and processes the Macula Greek Nestle 1904 lowfat XML syntax trees
 * from Clear-Bible/macula-greek into public/data/macula-syntax.json.
 *
 * Source: https://github.com/Clear-Bible/macula-greek/tree/main/Nestle1904/lowfat
 *
 * Output: public/data/macula-syntax.json
 *   Keys: "Matt.1.1.1" (osisId.chapter.verse.word)
 *   Values: { role?, phraseClass?, clauseRule?, clauseRole? }
 *
 * Usage: node scripts/import-macula-syntax.js
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

const OUT = path.join(__dirname, '..', 'public', 'data', 'macula-syntax.json')

// ── Helpers ───────────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const req = https.get(url, { timeout: 120000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout: ' + url)) })
  })
}

function getAttr(attrStr, name) {
  // xml:id has a colon which needs escaping in the regex
  const escaped = name.replace(':', '\\:')
  const re = new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`)
  const m  = re.exec(attrStr)
  return m ? m[1] : ''
}

// ── xml:id → our word ID ──────────────────────────────────────────────────────
// xml:id format: n40001001001 (nBBCCCVVVWWW)
//   BB  = book number (2 digits)
//   CCC = chapter     (3 digits)
//   VVV = verse       (3 digits)
//   WWW = word pos    (3 digits)
// → "Matt.1.1.1"

const BOOK_NUM_TO_OSIS = {
  40: 'Matt',  41: 'Mark',   42: 'Luke',   43: 'John',   44: 'Acts',
  45: 'Rom',   46: '1Cor',   47: '2Cor',   48: 'Gal',    49: 'Eph',
  50: 'Phil',  51: 'Col',    52: '1Thess', 53: '2Thess', 54: '1Tim',
  55: '2Tim',  56: 'Titus',  57: 'Phlm',   58: 'Heb',    59: 'Jas',
  60: '1Pet',  61: '2Pet',   62: '1John',  63: '2John',  64: '3John',
  65: 'Jude',  66: 'Rev',
}

function xmlIdToWordId(xmlId) {
  const digits = xmlId.replace(/^n/, '')
  if (digits.length < 11) return null
  const bookNum = parseInt(digits.slice(0, 2), 10)
  const chapter = parseInt(digits.slice(2, 5), 10)
  const verse   = parseInt(digits.slice(5, 8), 10)
  const word    = parseInt(digits.slice(8, 11), 10)
  const osisId  = BOOK_NUM_TO_OSIS[bookNum]
  if (!osisId) return null
  return `${osisId}.${chapter}.${verse}.${word}`
}

// ── Phrase-level wg classes ───────────────────────────────────────────────────

const PHRASE_CLASSES = new Set(['np', 'vp', 'pp', 'adjp', 'advp'])

// ── Parse one book XML ────────────────────────────────────────────────────────

function parseBookXml(xml) {
  const result = {}

  // Stack of { cls, role, rule } pushed for every <wg>, popped on </wg>
  const stack = []

  // Match <wg ...> (with possible self-close), </wg>, and <w ...> (word)
  // Note: Macula <w> elements are NOT self-closing in the lowfat format
  const re = /<\/wg>|<wg([^>]*)>|<w([^>]*?)(?:\/>|>)/g
  let m

  while ((m = re.exec(xml)) !== null) {
    const token = m[0]

    if (token === '</wg>') {
      stack.pop()
      continue
    }

    if (token.startsWith('<wg')) {
      const attrs = m[1] || ''
      const cls  = getAttr(attrs, 'class')
      const role = getAttr(attrs, 'role')
      const rule = getAttr(attrs, 'rule')
      stack.push({ cls, role, rule })
      continue
    }

    // <w ...> word element
    const attrs = m[2] || ''

    // Try xml:id first, then id
    let xmlId = ''
    const xmlIdM = /\bxml:id="([^"]*)"/.exec(attrs)
    if (xmlIdM) xmlId = xmlIdM[1]
    else xmlId = getAttr(attrs, 'id')

    if (!xmlId) continue

    const wordId = xmlIdToWordId(xmlId)
    if (!wordId) continue

    // Walk ancestor stack (last = closest ancestor)
    let phraseRole  = ''
    let phraseClass = ''
    let clauseRule  = ''
    let clauseRole  = ''

    for (let i = stack.length - 1; i >= 0; i--) {
      const { cls, role, rule } = stack[i]

      if (!phraseClass && PHRASE_CLASSES.has(cls)) {
        phraseRole  = role
        phraseClass = cls
      }

      if (!clauseRule && cls === 'cl') {
        clauseRule = rule
        clauseRole = role
        break  // clause is always above phrase
      }
    }

    const entry = {}
    if (phraseRole)  entry.role       = phraseRole
    if (phraseClass) entry.phraseClass = phraseClass
    if (clauseRule)  entry.clauseRule  = clauseRule
    if (clauseRole)  entry.clauseRole  = clauseRole

    if (Object.keys(entry).length > 0) {
      result[wordId] = entry
    }
  }

  return result
}

// ── Book list ─────────────────────────────────────────────────────────────────

const BOOKS = [
  '01-matthew',
  '02-mark',
  '03-luke',
  '04-john',
  '05-acts',
  '06-romans',
  '07-1corinthians',
  '08-2corinthians',
  '09-galatians',
  '10-ephesians',
  '11-philippians',
  '12-colossians',
  '13-1thessalonians',
  '14-2thessalonians',
  '15-1timothy',
  '16-2timothy',
  '17-titus',
  '18-philemon',
  '19-hebrews',
  '20-james',
  '21-1peter',
  '22-2peter',
  '23-1john',
  '24-2john',
  '25-3john',
  '26-jude',
  '27-revelation',
]

const BASE_URL = 'https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/Nestle1904/lowfat/'

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const combined = {}
  let totalWords = 0

  for (const filename of BOOKS) {
    const url = `${BASE_URL}${filename}.xml`
    console.log(`Fetching ${filename}.xml…`)

    let xml
    try {
      xml = await fetchUrl(url)
    } catch (err) {
      console.error(`  ERROR: ${err.message}`)
      continue
    }

    console.log(`  Parsing…`)
    const entries = parseBookXml(xml)
    const count   = Object.keys(entries).length
    totalWords   += count
    console.log(`  ${count} words extracted`)

    Object.assign(combined, entries)
  }

  fs.writeFileSync(OUT, JSON.stringify(combined))
  console.log(`\nWrote ${totalWords} entries to ${OUT}`)
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
