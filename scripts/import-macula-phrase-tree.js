#!/usr/bin/env node
/**
 * Builds a NESTED phrase/clause syntax tree from the Macula Greek Nestle 1904
 * lowfat XML (Clear-Bible/macula-greek, CC BY 4.0) for the Phrase tool.
 *
 * The existing import-macula-syntax.js flattens the tree to per-word tags; this
 * keeps the hierarchy (sentence → clause → phrase → word) so the Phrase view can
 * show the levels.
 *
 * Source: https://github.com/Clear-Bible/macula-greek/tree/main/Nestle1904/lowfat
 * Output: public/data/phrase-tree-john.json   (prototype: John chapter 1 only)
 * Attribution required by CC BY 4.0: "MACULA Greek Linguistic Datasets,
 *   available at https://github.com/Clear-Bible/macula-greek/"
 *
 * Usage: node scripts/import-macula-phrase-tree.js
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const BOOK_FILE = '04-john'
const OSIS = 'John'
const ONLY_CHAPTER = 1 // prototype scope
const URL = `https://raw.githubusercontent.com/Clear-Bible/macula-greek/main/Nestle1904/lowfat/${BOOK_FILE}.xml`
const OUT = path.join(__dirname, '..', 'public', 'data', 'phrase-tree-john.json')

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    https.get(url, { timeout: 120000 }, res => {
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

// xml:id n43001001001 → { chapter, verse, word }
function parseId(xmlId) {
  const d = xmlId.replace(/^n/, '')
  if (d.length < 11) return null
  return { chapter: +d.slice(2, 5), verse: +d.slice(5, 8), word: +d.slice(8, 11) }
}

function build(xml) {
  // Tokens: <sentence>, </sentence>, <wg ...>, </wg>, <w ...>text</w>
  const re = /<sentence>|<\/sentence>|<wg([^>]*)>|<\/wg>|<w([^>]*?)>([^<]*)<\/w>/g
  const sentences = []
  let sentence = null
  let stack = []
  let m
  while ((m = re.exec(xml)) !== null) {
    const tok = m[0]
    if (tok === '<sentence>') {
      sentence = { root: { t: 'g', c: [] }, minV: Infinity, maxV: -Infinity, chapter: null }
      stack = [sentence.root]
      continue
    }
    if (tok === '</sentence>') {
      if (sentence && sentence.root.c.length) sentences.push(sentence)
      sentence = null
      stack = []
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
    // <w ...>text</w>
    const a = m[2] || ''
    const text = m[3] || ''
    const xmlId = attr(a, 'xml:id') || attr(a, 'id')
    const id = parseId(xmlId)
    if (!id) continue
    sentence.minV = Math.min(sentence.minV, id.verse)
    sentence.maxV = Math.max(sentence.maxV, id.verse)
    if (sentence.chapter === null) sentence.chapter = id.chapter
    stack[stack.length - 1].c.push({
      t: 'w',
      id: `${OSIS}.${id.chapter}.${id.verse}.${id.word}`,
      w: text,
      gloss: attr(a, 'gloss'),
      lemma: attr(a, 'lemma'),
      morph: attr(a, 'morph'),
      role: attr(a, 'role'),
      cls: attr(a, 'class'),
    })
  }
  return sentences
}

// Drop empty attrs to keep the JSON small.
function clean(node) {
  if (node.t === 'g') {
    const o = { t: 'g', c: node.c.map(clean) }
    for (const k of ['cls', 'role', 'rule']) if (node[k]) o[k] = node[k]
    return o
  }
  const o = { t: 'w', id: node.id, w: node.w }
  for (const k of ['gloss', 'lemma', 'morph', 'role', 'cls']) if (node[k]) o[k] = node[k]
  return o
}

async function main() {
  console.log('Downloading', URL)
  const xml = await fetchUrl(URL)
  const all = build(xml)
  const inScope = all.filter(s => s.chapter === ONLY_CHAPTER)
  const out = {
    book: OSIS,
    chapter: ONLY_CHAPTER,
    attribution: 'MACULA Greek Linguistic Datasets (CC BY 4.0), https://github.com/Clear-Bible/macula-greek/',
    sentences: inScope.map(s => ({
      ref: s.minV === s.maxV ? `${OSIS} ${s.chapter}:${s.minV}` : `${OSIS} ${s.chapter}:${s.minV}–${s.maxV}`,
      startVerse: s.minV,
      endVerse: s.maxV,
      tree: clean(s.root),
    })),
  }
  fs.writeFileSync(OUT, JSON.stringify(out))
  console.log(`Wrote ${out.sentences.length} sentences for ${OSIS} ${ONLY_CHAPTER} → ${OUT} (${fs.statSync(OUT).size} bytes)`)
}
main().catch(e => { console.error(e); process.exit(1) })
