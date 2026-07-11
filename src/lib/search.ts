import fs from 'fs'
import path from 'path'
import type { Corpus, BiblicalVerse } from '@/types/biblical-text'
import { prisma } from './db'

export type SearchCorpus = Corpus | 'BOTH'

// ─── Search-index cache ───────────────────────────────────────────────────────

interface IndexVerse {
  id: string
  bookId: string
  chapter: number
  verse: number
  reference: string
  text: string
  bookName: string
  bookAbbrev: string
  corpus: Corpus
}

import { normalizeGreek } from './greek-utils'

interface IndexEntry {
  verse: IndexVerse
  normalizedText: string
}

let _index: IndexVerse[] | null = null
let _normalizedIndex: IndexEntry[] | null = null

function getIndex(): IndexVerse[] {
  if (_index) return _index
  const file = path.join(process.cwd(), 'public', 'data', 'search-index.json')
  try {
    _index = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    _index = []
  }
  return _index!
}

function getNormalizedIndex(): IndexEntry[] {
  if (_normalizedIndex) return _normalizedIndex
  _normalizedIndex = getIndex().map(verse => ({
    verse,
    normalizedText: normalizeGreek(verse.text),
  }))
  return _normalizedIndex
}

function indexToVerse(v: IndexVerse): BiblicalVerse {
  return { id: v.id, bookId: v.bookId, chapter: v.chapter, verse: v.verse,
           reference: v.reference, text: v.text }
}

// ─── Text search ──────────────────────────────────────────────────────────────

export async function searchByGreekWord(
  query: string,
  corpus: SearchCorpus,
): Promise<BiblicalVerse[]> {
  const q = normalizeGreek(query)
  return getNormalizedIndex()
    .filter(e => (corpus === 'BOTH' || e.verse.corpus === corpus) && e.normalizedText.includes(q))
    .map(e => indexToVerse(e.verse))
}

export async function searchByReference(
  ref: string,
  corpus: SearchCorpus,
  limit = 50,
): Promise<BiblicalVerse[]> {
  const q = ref.toLowerCase()
  return getIndex()
    .filter(v => (corpus === 'BOTH' || v.corpus === corpus) && v.reference.toLowerCase().includes(q))
    .slice(0, limit)
    .map(indexToVerse)
}

// ─── Word suggestions (autocomplete) ──────────────────────────────────────────

// Keep only letters (Latin+accents, Greek, Cyrillic, Hangul, CJK); drop punctuation/
// digits. Avoids the \p{L}/u regex flag so it type-checks under an es5 target.
const WORD_STRIP = /[^A-Za-zÀ-ɏͰ-῿가-힣一-鿿]/g

// Greek suggestions are dictionary words (lexemes), not inflected surface forms, so typing
// "λογ" offers distinct words (λόγος, λογίζομαι, λόγιον…) each with its gloss — not a dozen
// forms of λόγος. Sourced from the lexicon table, cached, ranked by frequency.
let _lexVocab: { norm: string; word: string; sub: string }[] | null = null

async function getLexemeVocab() {
  if (_lexVocab) return _lexVocab
  const rows = await prisma.lexicalEntry.findMany({
    select: { lexeme: true, gloss: true },
    orderBy: { frequency: 'desc' },
  })
  _lexVocab = rows.map(r => ({ norm: normalizeGreek(r.lexeme), word: r.lexeme, sub: r.gloss }))
  return _lexVocab
}

/** Up to `limit` Greek lexemes beginning with `prefix` (accent-insensitive), most common first. */
export async function suggestGreekLexemes(prefix: string, limit = 12): Promise<{ word: string; sub: string }[]> {
  const p = normalizeGreek(prefix)
  if (p.length < 2) return []
  const vocab = await getLexemeVocab()
  const out: { word: string; sub: string }[] = []
  for (const w of vocab) {
    if (w.norm.startsWith(p)) { out.push({ word: w.word, sub: w.sub }); if (out.length >= limit) break }
  }
  return out
}

// Find every verse containing any inflected form of a lexeme: get the lemma's attested
// surface forms from the DB, then match them (exact, accent-insensitive) against the index.
export async function searchByLemma(lexeme: string, corpus: SearchCorpus): Promise<BiblicalVerse[]> {
  const entry = await prisma.lexicalEntry.findFirst({ where: { lexeme }, select: { id: true } })
  if (!entry) return searchByGreekWord(lexeme, corpus)  // unknown lemma → fall back to surface search
  const rows = await prisma.verseWord.findMany({
    where: { lexemeId: entry.id }, select: { surface: true }, distinct: ['surface'],
  })
  const forms = new Set(rows.map(r => normalizeGreek(r.surface.replace(WORD_STRIP, ''))).filter(Boolean))
  if (forms.size === 0) return searchByGreekWord(lexeme, corpus)
  const out: BiblicalVerse[] = []
  for (const e of getNormalizedIndex()) {
    if (corpus !== 'BOTH' && e.verse.corpus !== corpus) continue
    for (const w of e.normalizedText.split(/\s+/)) {
      const cw = w.replace(WORD_STRIP, '')
      if (cw && forms.has(cw)) { out.push(indexToVerse(e.verse)); break }
    }
  }
  return out
}

// ─── Lexicon search (still DB-backed — lexical entries are small) ─────────────

export async function searchLexicon(query: string, limit = 20) {
  return prisma.lexicalEntry.findMany({
    where: {
      OR: [
        { lexeme:   { contains: query, mode: 'insensitive' } },
        { gloss:    { contains: query, mode: 'insensitive' } },
        { strongs:  { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { frequency: 'desc' },
    take: limit,
  })
}
