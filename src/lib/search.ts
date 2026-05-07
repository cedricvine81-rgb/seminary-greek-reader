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
