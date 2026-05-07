#!/usr/bin/env node
/**
 * Downloads and processes the Asian Bible Society Nestle 1904 NT Syntax Trees
 * from biblicalhumanities/greek-new-testament into public/data/abs-syntax.json.
 *
 * Source: https://github.com/biblicalhumanities/greek-new-testament
 *         /syntax-trees/nestle1904/xml/
 *
 * Output: public/data/abs-syntax.json
 *   Keys: "Matt.1.1.1" (osisId.chapter.verse.word)
 *   Values: { phrase?, function?, rule?, clauseRule? }
 *
 * Usage: node scripts/import-abs-syntax.js
 */

const fs   = require('fs')
const path = require('path')
const https = require('https')

const OUT = path.join(__dirname, '..', 'public', 'data', 'abs-syntax.json')

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
  const re = new RegExp(`${name}="([^"]*)"`)
  const m  = re.exec(attrStr)
  return m ? m[1] : ''
}

// ── morphId → our word ID ─────────────────────────────────────────────────────
// morphId format: 40001001001 (BBCCCVVVWWW)
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

function morphIdToWordId(morphId) {
  const digits = morphId.replace(/^n/, '')
  if (digits.length < 11) return null
  const bookNum = parseInt(digits.slice(0, 2), 10)
  const chapter = parseInt(digits.slice(2, 5), 10)
  const verse   = parseInt(digits.slice(5, 8), 10)
  const word    = parseInt(digits.slice(8, 11), 10)
  const osisId  = BOOK_NUM_TO_OSIS[bookNum]
  if (!osisId) return null
  return `${osisId}.${chapter}.${verse}.${word}`
}

// ── Phrase category mapping ───────────────────────────────────────────────────

const PHRASE_CATS = new Set(['np', 'vp', 'pp', 'adjp', 'advp'])

const PHRASE_MAP = {
  np: 'NP', vp: 'VP', pp: 'PP', adjp: 'AdjP', advp: 'AdvP',
}

// Functional/clause roles (uppercase in the XML)
const FUNC_CATS = new Set(['S', 'O', 'O2', 'IO', 'V', 'P', 'ADV', 'VC'])

// ── Parse one book XML ────────────────────────────────────────────────────────

function parseBookXml(xml) {
  const result = {}

  // Stack of { cat, rule }
  const stack = []

  // Tokenise: match opening <Node ...> and closing </Node>
  const re = /<\/Node>|<Node\s([^>]*)>/g
  let m

  while ((m = re.exec(xml)) !== null) {
    const token = m[0]

    if (token === '</Node>') {
      stack.pop()
      continue
    }

    // Opening <Node attrs>
    const attrs = m[1]
    const cat     = getAttr(attrs, 'Cat')
    const rule    = getAttr(attrs, 'Rule')    || null
    const morphId = getAttr(attrs, 'morphId') || null

    stack.push({ cat, rule })

    if (morphId) {
      const wordId = morphIdToWordId(morphId)
      if (!wordId) continue

      // Walk ancestors (top = most recent = closest)
      // stack includes this word's own frame as the last entry
      const ancestors = stack.slice(0, -1)

      let phrase      = null
      let phraseRule  = null
      let funcRole    = null
      let clauseRule  = null

      for (let i = ancestors.length - 1; i >= 0; i--) {
        const { cat: ac, rule: ar } = ancestors[i]
        const acl = ac.toLowerCase()

        // Closest phrase-level ancestor
        if (!phrase && PHRASE_CATS.has(acl)) {
          phrase     = PHRASE_MAP[acl]
          phraseRule = ar
        }

        // Closest functional ancestor (Subject, Object, etc.)
        if (!funcRole && FUNC_CATS.has(ac)) {
          funcRole = ac
        }

        // Closest clause rule (Rule on the CL node)
        if (!clauseRule && ac === 'CL' && ar) {
          clauseRule = ar
        }
      }

      const entry = {}
      if (phrase)     entry.phrase     = phrase
      if (phraseRule) entry.rule       = phraseRule
      if (funcRole)   entry.function   = funcRole
      if (clauseRule) entry.clauseRule = clauseRule

      if (Object.keys(entry).length > 0) {
        result[wordId] = entry
      }
    }
  }

  return result
}

// ── Book list ─────────────────────────────────────────────────────────────────

const BOOKS = [
  ['01-matthew',        'Matt'],
  ['02-mark',           'Mark'],
  ['03-luke',           'Luke'],
  ['04-john',           'John'],
  ['05-acts',           'Acts'],
  ['06-romans',         'Rom'],
  ['07-1corinthians',   '1Cor'],
  ['08-2corinthians',   '2Cor'],
  ['09-galatians',      'Gal'],
  ['10-ephesians',      'Eph'],
  ['11-philippians',    'Phil'],
  ['12-colossians',     'Col'],
  ['13-1thessalonians', '1Thess'],
  ['14-2thessalonians', '2Thess'],
  ['15-1timothy',       '1Tim'],
  ['16-2timothy',       '2Tim'],
  ['17-titus',          'Titus'],
  ['18-philemon',       'Phlm'],
  ['19-hebrews',        'Heb'],
  ['20-james',          'Jas'],
  ['21-1peter',         '1Pet'],
  ['22-2peter',         '2Pet'],
  ['23-1john',          '1John'],
  ['24-2john',          '2John'],
  ['25-3john',          '3John'],
  ['26-jude',           'Jude'],
  ['27-revelation',     'Rev'],
]

const BASE_URL = 'https://raw.githubusercontent.com/biblicalhumanities/greek-new-testament/master/syntax-trees/nestle1904/xml/'

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const combined = {}
  let totalWords = 0

  for (const [filename, osisId] of BOOKS) {
    const url = `${BASE_URL}${filename}.xml`
    console.log(`Fetching ${osisId} (${filename}.xml)…`)

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
