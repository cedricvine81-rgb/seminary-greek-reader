// Turning a Construct-search hit in a prose corpus into something displayable: the work's name,
// a citation, the Greek, and a target the Texts reader understands.
//
// Server-only. Book keys in the prose indexes are the work's data path relative to /data, minus
// the extension ('greco/aristotle-poetics', 'josephus/jewish-war/4') — see
// scripts/build-construct-index.mjs. Every prose file carries its own `work` name, so the display
// name comes from the data rather than from a registry; only the Texts LINK needs the registry.

import fs from 'fs'
import path from 'path'
import { PROSE_WORKS } from './prose-texts'

// Two shapes in the corpus: most works are chapters[].verses[], Josephus is chapters[].sections[]
// numbered continuously across a book (the Niese sections, which are what Josephus is cited by).
interface ProseUnit { number: number; text?: string; greek?: string }
interface ProseChapter { number: number; title?: string; verses?: ProseUnit[]; sections?: ProseUnit[] }
interface ProseFile { work?: string; title?: string; number?: number; chapters?: ProseChapter[] }

const _files: Record<string, ProseFile | null> = {}

function load(bookKey: string): ProseFile | null {
  if (bookKey in _files) return _files[bookKey]
  try {
    _files[bookKey] = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', `${bookKey}.json`), 'utf8')) as ProseFile
  } catch {
    _files[bookKey] = null
  }
  return _files[bookKey]
}

// Where in the work a unit lives. Josephus's sections are keyed by section alone, so the chapter
// containing it has to be found — the Texts reader locates a passage by chapter.
function findUnit(file: ProseFile, chapter: number, verse: number): { unit: ProseUnit; chapter: number } | null {
  for (const ch of file.chapters ?? []) {
    if (ch.sections) {
      // Josephus: `chapter` is the book (which is the file), so only the section number matters.
      const unit = ch.sections.find(s => s.number === verse)
      if (unit) return { unit, chapter: ch.number }
    } else if (ch.number === chapter) {
      const unit = (ch.verses ?? []).find(v => v.number === verse)
      if (unit) return { unit, chapter: ch.number }
    }
  }
  return null
}

// The Texts reader's target shape (see OpenInTextsTarget in BackgroundsView).
interface TextsTarget {
  source: string
  workDir?: string
  book?: number
  chapter: number
  verse?: number
}

function targetFor(bookKey: string, chapter: number, verse: number, containingChapter: number): TextsTarget | null {
  const parts = bookKey.split('/')
  if (parts[0] === 'josephus' && parts.length === 3) {
    // 'josephus/jewish-war/4' → work directory + book number; `chapter` here IS the book.
    return { source: 'josephus', workDir: parts[1], book: Number(parts[2]), chapter: containingChapter, verse }
  }
  const work = PROSE_WORKS.find(w => w.dataUrl === `/data/${bookKey}.json`)
  return work ? { source: work.source, chapter, verse } : null
}

export interface ProseHitText {
  reference: string      // e.g. "The Jewish War 4:83", "Aristotle, Poetics 5:2"
  workName: string
  greek: string
  english: string
  target: TextsTarget | null
}

export function proseHitText(bookKey: string, chapter: number, verse: number): ProseHitText | null {
  const file = load(bookKey)
  if (!file) return null
  const found = findUnit(file, chapter, verse)
  if (!found) return null
  const workName = file.work ?? bookKey
  // Josephus cites as book.section, and `chapter` already holds the book; everything else is
  // chapter:verse within its own work.
  const reference = `${workName} ${chapter}:${verse}`
  return {
    reference,
    workName,
    greek: found.unit.greek ?? '',
    english: found.unit.text ?? '',
    target: targetFor(bookKey, chapter, verse, found.chapter),
  }
}
