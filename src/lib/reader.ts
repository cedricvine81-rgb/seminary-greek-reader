import 'server-only'
import fs from 'fs'
import path from 'path'
import type { Corpus, BiblicalBook, BiblicalVerse, VerseWord } from '@/types/biblical-text'
import type { LexicalEntry } from '@/types/lexicon'
import type { MorphParse } from '@/types/morphology'
export { formatParsing } from './morph-formatting'

// ─── Static-file paths ────────────────────────────────────────────────────────

const DATA_ROOT = path.join(process.cwd(), 'public', 'data')

// ─── In-memory caches ─────────────────────────────────────────────────────────

let _booksCache: { gnt: BiblicalBook[]; lxx: BiblicalBook[]; na1904?: BiblicalBook[] } | null = null
const _chapterCache = new Map<string, { book: BiblicalBook; chapter: number; verses: BiblicalVerse[] }>()

// ─── Gloss lookup (vocabulary-frequency words from seed data) ─────────────────
// Keyed by Greek lemma → { gloss, partOfSpeech, strongs }

type GlossEntry = { gloss: string; partOfSpeech: string; strongs?: string }
let _glossMap: Map<string, GlossEntry> | null = null
let _strongsMap: Map<string, GlossEntry> | null = null

// Exact NT (GNT) lemma occurrence counts, precomputed from the corpus text
// (prisma/seed-data/nt-lemma-frequency.json). Used to flag low-frequency words.
let _freqMap: Map<string, number> | null = null
function getNtFrequency(): Map<string, number> {
  if (_freqMap) return _freqMap
  _freqMap = new Map()
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'prisma/seed-data/nt-lemma-frequency.json'), 'utf8')) as Record<string, number>
    for (const [lemma, count] of Object.entries(raw)) _freqMap.set(lemma, count)
  } catch { /* missing in prod → frequencies default to 0 */ }
  return _freqMap
}

function buildGlossMaps() {
  if (_glossMap && _strongsMap) return
  _glossMap = new Map()
  _strongsMap = new Map()
  try {
    // Full Strong's lexicon (STEPBible TBESG, CC BY 4.0) — covers NT + LXX
    const strongs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'prisma/seed-data/lexicon-strongs-greek.json'), 'utf8')) as Record<string, { lexeme: string; gloss: string }>
    for (const [strongsKey, entry] of Object.entries(strongs)) {
      const ge: GlossEntry = { gloss: entry.gloss, partOfSpeech: '', strongs: strongsKey }
      if (!_strongsMap.has(strongsKey)) _strongsMap.set(strongsKey, ge)
      if (entry.lexeme && !_glossMap.has(entry.lexeme)) _glossMap.set(entry.lexeme, ge)
    }
    // NT frequency vocabulary overlaid last — richer partOfSpeech + frequency data
    const v50 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'prisma/seed-data/vocabulary-nt-50-plus.json'), 'utf8'))
    const v30 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'prisma/seed-data/vocabulary-nt-30-plus.json'), 'utf8'))
    for (const entry of [...v50, ...v30]) {
      const ge: GlossEntry = { gloss: entry.gloss, partOfSpeech: entry.partOfSpeech, strongs: entry.strongs }
      _glossMap.set(entry.lexeme, ge)
      if (entry.strongs) _strongsMap.set(entry.strongs, ge)
    }
  } catch { /* seed files missing in production — glosses just won't show */ }
}

function getGlossMap(): Map<string, GlossEntry> { buildGlossMaps(); return _glossMap! }
function getStrongsMap(): Map<string, GlossEntry> { buildGlossMaps(); return _strongsMap! }

// ─── Books index ──────────────────────────────────────────────────────────────

function loadBooksIndex() {
  if (_booksCache) return _booksCache
  const raw = fs.readFileSync(path.join(DATA_ROOT, 'books.json'), 'utf8')
  _booksCache = JSON.parse(raw)
  return _booksCache!
}

export function getBooks(corpus: Corpus): BiblicalBook[] {
  try {
    const index = loadBooksIndex()
    if (corpus === 'GNT') return index.gnt
    if (corpus === 'NA1904') return index.na1904 ?? []
    return index.lxx
  } catch {
    return []
  }
}

export function getAllBooks(): BiblicalBook[] {
  try {
    const index = loadBooksIndex()
    return [...index.gnt, ...index.lxx, ...(index.na1904 ?? [])]
  } catch {
    return []
  }
}

// ─── Chapter loading ──────────────────────────────────────────────────────────

interface RawWord {
  id: string
  position: number
  surface: string
  lemma: string
  strongs: string
  morph: {
    partOfSpeech: string
    casus: string | null
    number: string | null
    gender: string | null
    tense: string | null
    voice: string | null
    mood: string | null
    person: string | null
  }
}

function wordToVerseWord(raw: RawWord, verseId: string): VerseWord {
  const gloss = getGlossMap().get(raw.lemma)
    ?? (raw.strongs ? getStrongsMap().get(`G${raw.strongs}`) : undefined)
  const fakeId = `lex-${raw.lemma}`

  const lexeme: LexicalEntry = {
    id: fakeId,
    lexeme: raw.lemma,
    gloss: gloss?.gloss ?? '',
    partOfSpeech: gloss?.partOfSpeech ?? raw.morph.partOfSpeech,
    // Exact NT occurrence count for this lemma (0 if the lemma isn't in the GNT,
    // e.g. LXX-only words — treated as rare for the glossary).
    frequency: getNtFrequency().get(raw.lemma) ?? 0,
    strongs: gloss?.strongs ?? (raw.strongs ? `G${raw.strongs}` : undefined),
  }

  const parse: MorphParse = {
    id: `parse-${raw.id}`,
    wordId: raw.id,
    lexemeId: fakeId,
    surface: raw.surface,
    partOfSpeech: raw.morph.partOfSpeech,
    casus:  raw.morph.casus  ?? undefined,
    number: raw.morph.number ?? undefined,
    gender: raw.morph.gender ?? undefined,
    tense:  raw.morph.tense  ?? undefined,
    voice:  raw.morph.voice  ?? undefined,
    mood:   raw.morph.mood   ?? undefined,
    person: raw.morph.person ?? undefined,
  }

  return {
    id: raw.id,
    verseId,
    position: raw.position,
    surface: raw.surface,
    lexeme,
    parses: [parse],
  }
}

export function getChapter(bookOsisId: string, chapter: number, preferCorpus?: Corpus) {
  // Determine corpus from books index
  const allBooks = getAllBooks()
  const book = allBooks.find(b => b.osisId === bookOsisId)
  if (!book) return null

  // Try a preferred corpus first (e.g. NA1904 for the Exegesis screen), then fall
  // back to the book's native corpus so OT books and any missing chapter still load.
  const primary = (preferCorpus ?? book.corpus).toLowerCase()
  const nativeCorpus = book.corpus.toLowerCase()
  const cacheKey = `${bookOsisId}:${chapter}:${primary}`
  if (_chapterCache.has(cacheKey)) return _chapterCache.get(cacheKey)!

  const candidates = primary === nativeCorpus ? [primary] : [primary, nativeCorpus]
  let raw: { book: string; chapter: number; verses: Array<{
    id: string; bookId: string; chapter: number; verse: number
    reference: string; text: string; words: RawWord[]
  }> } | null = null
  for (const corpus of candidates) {
    try { raw = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, corpus, `${bookOsisId}_${chapter}.json`), 'utf8')); break } catch { /* try next corpus */ }
  }
  if (!raw) return null

  const verses: BiblicalVerse[] = raw.verses.map(v => ({
    id: v.id,
    bookId: v.bookId,
    chapter: v.chapter,
    verse: v.verse,
    reference: v.reference,
    text: v.text,
    words: v.words.map(w => wordToVerseWord(w, v.id)),
  }))

  const result = { book, chapter, verses }
  _chapterCache.set(cacheKey, result)
  return result
}

export function getVerse(bookOsisId: string, chapter: number, verseNum: number) {
  const chapterData = getChapter(bookOsisId, chapter)
  if (!chapterData) return null
  return chapterData.verses.find(v => v.verse === verseNum) ?? null
}

