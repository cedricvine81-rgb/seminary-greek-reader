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

// Reads one corpus chapter file. On Vercel, this fetches it from the deployment's own
// static assets instead of the local filesystem — public/data/{gnt,lxx,na1904} together
// run well over 200MB, and a plain fs.readFileSync with a dynamic path makes Next's
// build tracer bundle the *entire* directory into this function (it can't tell which
// files a dynamic path might touch), which blew past Vercel's 250MB uncompressed
// function-size limit. Fetching them as static assets instead means they're served
// straight from the CDN and never counted against the function bundle at all — see the
// matching outputFileTracingExcludes entries in next.config.js. Locally there's no
// VERCEL_URL, so this just reads the file directly (faster, no self-fetch round trip).
async function readCorpusFile(corpus: string, bookOsisId: string, chapter: number): Promise<string | null> {
  const relPath = `${corpus}/${bookOsisId}_${chapter}.json`
  if (process.env.VERCEL_URL) {
    try {
      const res = await fetch(`https://${process.env.VERCEL_URL}/data/${relPath}`)
      return res.ok ? await res.text() : null
    } catch {
      return null
    }
  }
  try {
    return fs.readFileSync(path.join(DATA_ROOT, relPath), 'utf8')
  } catch {
    return null
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

// Expand the compact NA1904 chapter format into the standard reader shape.
// Compact: { b: osisId, c: chapter, v: { "<verse>": [[surface, lemma, strongs], …] } }
function expandCompactChapter(raw: { b: string; c: number; v: Record<string, [string, string, string][]> }, bookName: string) {
  const verses = Object.keys(raw.v)
    .map(Number).sort((a, b) => a - b)
    .map(vn => {
      const words: RawWord[] = raw.v[String(vn)].map((t, i) => ({
        id: `${raw.b}.${raw.c}.${vn}.${i + 1}`,
        position: i + 1,
        surface: t[0],
        lemma: t[1] || '',
        strongs: t[2] || '',
        morph: { partOfSpeech: '', casus: null, number: null, gender: null, tense: null, voice: null, mood: null, person: null },
      }))
      return {
        id: `${raw.b}.${raw.c}.${vn}`, bookId: raw.b, chapter: raw.c, verse: vn,
        reference: `${bookName} ${raw.c}:${vn}`, text: words.map(w => w.surface).join(' '), words,
      }
    })
  return { book: raw.b, chapter: raw.c, verses }
}

export async function getChapter(bookOsisId: string, chapter: number, preferCorpus?: Corpus) {
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

  type RawVerse = { id: string; bookId: string; chapter: number; verse: number; reference: string; text: string; words: RawWord[] }
  const candidates = primary === nativeCorpus ? [primary] : [primary, nativeCorpus]
  let raw: { book: string; chapter: number; verses: RawVerse[] } | null = null
  for (const corpus of candidates) {
    const text = await readCorpusFile(corpus, bookOsisId, chapter)
    if (!text) continue
    try {
      const parsed = JSON.parse(text)
      // NA1904 ships a compact format ({ b, c, v: { verse: [[surface,lemma,strongs]…] } })
      // to keep the function bundle small — expand it to the standard shape here.
      raw = parsed.verses ? parsed : expandCompactChapter(parsed, book.name)
      break
    } catch { /* try next corpus */ }
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

export async function getVerse(bookOsisId: string, chapter: number, verseNum: number) {
  const chapterData = await getChapter(bookOsisId, chapter)
  if (!chapterData) return null
  return chapterData.verses.find(v => v.verse === verseNum) ?? null
}

