#!/usr/bin/env node
/**
 * Build Reader-format chapter files for the Nestle 1904 GNT (public domain) from
 * the MACULA Greek phrase-tree data, so the Exegesis screen can serve NA1904 the
 * same way it serves the GNT/LXX corpora.
 *
 * Source: public/data/phrase-tree/<OsisId>.json (MACULA, Nestle 1904, CC BY 4.0)
 * Output: public/data/na1904/<OsisId>_<chapter>.json
 *   { book, chapter, verses: [{ id, bookId, chapter, verse, reference, text, words:[RawWord] }] }
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'public', 'data')
const TREE_DIR = path.join(ROOT, 'phrase-tree')
const OUT_DIR = path.join(ROOT, 'na1904')

const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8')).gnt
const nameOf = Object.fromEntries(books.map(b => [b.osisId, b.name]))

// Collect every word node (t === 'w') from a tree, in document order.
function collectWords(node, out) {
  if (!node) return
  if (node.t === 'w') { out.push(node); return }
  for (const c of node.c || []) collectWords(c, out)
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let totalChapters = 0, totalVerses = 0, totalWords = 0

  for (const b of books) {
    const treePath = path.join(TREE_DIR, `${b.osisId}.json`)
    if (!fs.existsSync(treePath)) { console.warn('skip (no tree):', b.osisId); continue }
    const tree = JSON.parse(fs.readFileSync(treePath, 'utf8'))

    // verseMap: "chapter:verse" -> { chapter, verse, words: [] }
    const verseMap = new Map()
    for (const sent of tree.sentences || []) {
      const words = []
      collectWords(sent.tree, words)
      for (const w of words) {
        const parts = String(w.id).split('.')          // Osis.ch.v.pos
        const chapter = parseInt(parts[1], 10)
        const verse = parseInt(parts[2], 10)
        const position = parseInt(parts[3], 10) || 0
        if (!chapter || !verse) continue
        const key = `${chapter}:${verse}`
        if (!verseMap.has(key)) verseMap.set(key, { chapter, verse, words: [] })
        // Slim shape: the reader fills verseId from the verse and reads only
        // morph.partOfSpeech here (other morph fields default to undefined), so we
        // omit the redundant verseId and the all-null morph fields to keep the
        // serverless bundle small.
        const word = { id: w.id, position, surface: w.w, lemma: w.lemma || '', morph: { partOfSpeech: w.parsing || '' } }
        if (w.strongs) word.strongs = w.strongs
        verseMap.get(key).words.push(word)
      }
    }

    // Group verses into chapters.
    const chapters = new Map()
    for (const v of verseMap.values()) {
      v.words.sort((a, x) => a.position - x.position)
      const verse = {
        id: `${b.osisId}.${v.chapter}.${v.verse}`,
        bookId: b.osisId,
        chapter: v.chapter,
        verse: v.verse,
        reference: `${nameOf[b.osisId]} ${v.chapter}:${v.verse}`,
        text: v.words.map(w => w.surface).join(' '),
        words: v.words,
      }
      if (!chapters.has(v.chapter)) chapters.set(v.chapter, [])
      chapters.get(v.chapter).push(verse)
      totalVerses++; totalWords += v.words.length
    }

    for (const [chapter, verses] of chapters) {
      verses.sort((a, x) => a.verse - x.verse)
      fs.writeFileSync(path.join(OUT_DIR, `${b.osisId}_${chapter}.json`), JSON.stringify({ book: b.osisId, chapter, verses }))
      totalChapters++
    }
  }

  // Sanity check: ensure John 1:1 reconstructs.
  const john1 = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'John_1.json'), 'utf8'))
  console.log('John 1:1 →', john1.verses[0].text)
  console.log(`Wrote ${totalChapters} chapters, ${totalVerses} verses, ${totalWords} words → ${OUT_DIR}`)
}
main()
