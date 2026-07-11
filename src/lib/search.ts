import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
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

// ─── Word suggestions (autocomplete) & lemma search ──────────────────────────

// A comprehensive GNT lemma index (scripts/build-lemma-index.mjs): every lemma with a
// gloss, frequency, and the verses it occurs in (in any inflected form). Built from the
// parsing trees, so it covers every word — not just the vocabulary lexicon. Small enough
// (~0.4 MB) to bundle and read via fs; ranked by frequency.
interface LemmaEntry { n: string; l: string; g: string; f: number; v: string[] }
let _lemmaIndex: LemmaEntry[] | null = null
let _lemmaByNorm: Map<string, LemmaEntry> | null = null

function getLemmaIndex(): LemmaEntry[] {
  if (_lemmaIndex) return _lemmaIndex
  const file = path.join(process.cwd(), 'public', 'data', 'lemma-index.json.gz')
  try {
    _lemmaIndex = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'))
  } catch {
    _lemmaIndex = []
  }
  return _lemmaIndex!
}
function getLemmaByNorm(): Map<string, LemmaEntry> {
  if (_lemmaByNorm) return _lemmaByNorm
  _lemmaByNorm = new Map(getLemmaIndex().map(e => [e.n, e] as [string, LemmaEntry]))
  return _lemmaByNorm
}

// Greek suggestions are dictionary words (lexemes), not inflected surface forms, so typing
// "λογ" offers distinct words (λόγος, λογίζομαι, λόγιον…) each with its gloss.
export function suggestGreekLexemes(prefix: string, limit = 12): { word: string; sub: string }[] {
  const p = normalizeGreek(prefix)
  if (p.length < 2) return []
  const out: { word: string; sub: string }[] = []
  for (const e of getLemmaIndex()) {          // pre-sorted by frequency
    if (e.n.startsWith(p)) { out.push({ word: e.l, sub: e.g }); if (out.length >= limit) break }
  }
  return out
}

// Every verse containing any inflected form of a lexeme — straight from the lemma index.
export async function searchByLemma(lexeme: string, corpus: SearchCorpus): Promise<BiblicalVerse[]> {
  const entry = getLemmaByNorm().get(normalizeGreek(lexeme))
  if (!entry) return searchByGreekWord(lexeme, corpus)  // unknown lemma → fall back to surface search
  const vset = new Set(entry.v)
  const out: BiblicalVerse[] = []
  for (const v of getIndex()) {               // iterate the index for canonical order
    if ((corpus === 'BOTH' || v.corpus === corpus) && vset.has(v.id)) out.push(indexToVerse(v))
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
