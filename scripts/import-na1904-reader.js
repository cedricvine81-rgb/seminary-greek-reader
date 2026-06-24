#!/usr/bin/env node
/**
 * Build compact Nestle 1904 (public domain) chapter files from the MACULA Greek
 * phrase-tree, so the Exegesis screen can serve NA1904 without bloating the
 * serverless function (the corpora are fs-read into the reader function, which is
 * near Vercel's 250 MB limit). The reader expands these tuples (see getChapter).
 *
 * Source: public/data/phrase-tree/<OsisId>.json (MACULA, Nestle 1904, CC BY 4.0)
 * Output: public/data/na1904/<OsisId>_<chapter>.json
 *   { b: osisId, c: chapter, v: { "<verse>": [[surface, lemma, strongs], …] } }
 *   id + position are reconstructed from book/chapter/verse + array index.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'public', 'data')
const TREE_DIR = path.join(ROOT, 'phrase-tree')
const OUT_DIR = path.join(ROOT, 'na1904')
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8')).gnt

function collectWords(node, out) {
  if (!node) return
  if (node.t === 'w') { out.push(node); return }
  for (const c of node.c || []) collectWords(c, out)
}

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true })
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let chapters = 0, verses = 0, words = 0

  for (const b of books) {
    const treePath = path.join(TREE_DIR, `${b.osisId}.json`)
    if (!fs.existsSync(treePath)) { console.warn('skip (no tree):', b.osisId); continue }
    const tree = JSON.parse(fs.readFileSync(treePath, 'utf8'))

    // chapterMap: chapter -> { verse -> [{pos, tuple}] }
    const chapterMap = new Map()
    for (const sent of tree.sentences || []) {
      const ws = []
      collectWords(sent.tree, ws)
      for (const w of ws) {
        const [, cs, vs, ps] = String(w.id).split('.')
        const chapter = parseInt(cs, 10), verse = parseInt(vs, 10), pos = parseInt(ps, 10) || 0
        if (!chapter || !verse) continue
        if (!chapterMap.has(chapter)) chapterMap.set(chapter, new Map())
        const vmap = chapterMap.get(chapter)
        if (!vmap.has(verse)) vmap.set(verse, [])
        vmap.get(verse).push({ pos, tuple: [w.w, w.lemma || '', w.strongs || ''] })
      }
    }

    for (const [chapter, vmap] of chapterMap) {
      const v = {}
      for (const [verse, list] of [...vmap.entries()].sort((a, x) => a[0] - x[0])) {
        list.sort((a, x) => a.pos - x.pos)
        v[verse] = list.map(e => e.tuple)
        verses++; words += list.length
      }
      fs.writeFileSync(path.join(OUT_DIR, `${b.osisId}_${chapter}.json`), JSON.stringify({ b: b.osisId, c: chapter, v }))
      chapters++
    }
  }

  const j = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'John_1.json'), 'utf8'))
  console.log('John 1:1 →', j.v['1'].map(t => t[0]).join(' '))
  console.log(`Wrote ${chapters} chapters, ${verses} verses, ${words} words`)
}
main()
