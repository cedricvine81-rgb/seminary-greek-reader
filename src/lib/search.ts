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

// Distinct Greek words keyed by their normalized (accent-stripped) form, with the most
// frequent actual spelling as the display. Built once from the index, ranked by frequency.
let _greekVocab: { norm: string; display: string; count: number }[] | null = null

function getGreekVocab() {
  if (_greekVocab) return _greekVocab
  const byNorm = new Map<string, { count: number; forms: Map<string, number> }>()
  for (const v of getIndex()) {
    for (const raw of v.text.split(/\s+/)) {
      const token = raw.replace(WORD_STRIP, '')
      if (token.length < 2) continue
      const norm = normalizeGreek(token)
      if (!norm) continue
      let e = byNorm.get(norm)
      if (!e) { e = { count: 0, forms: new Map() }; byNorm.set(norm, e) }
      e.count++
      e.forms.set(token, (e.forms.get(token) ?? 0) + 1)
    }
  }
  _greekVocab = Array.from(byNorm.entries()).map(([norm, e]) => {
    let display = '', best = 0
    for (const [f, n] of Array.from(e.forms.entries())) if (n > best) { display = f; best = n }
    return { norm, display, count: e.count }
  }).sort((a, b) => b.count - a.count)
  return _greekVocab
}

/** Up to `limit` Greek words beginning with `prefix` (accent-insensitive), most common first. */
export function suggestGreekWords(prefix: string, limit = 12): string[] {
  const p = normalizeGreek(prefix)
  if (p.length < 2) return []
  const out: string[] = []
  for (const w of getGreekVocab()) {
    if (w.norm.startsWith(p)) { out.push(w.display); if (out.length >= limit) break }
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
