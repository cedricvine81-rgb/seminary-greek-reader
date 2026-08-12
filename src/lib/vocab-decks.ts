/**
 * The vocabulary decks, and the one place their sections/subsections are derived.
 *
 * Two decks share a shape and a study UI: the Greek Biblical Greek Vocabulary Builder
 * (bgvb-vocabulary.json) and the Hebrew frequency deck built from the MT by
 * scripts/build-hebrew-vocabulary.py. This module holds the derivation both need so the
 * study page, the instructor's quiz builder and the server-side quiz generator all band the
 * same words the same way.
 *
 * KEYED BY ID, NOT BY HEADWORD. Greek lemmas are unique, but the Hebrew deck has 19
 * homographs — אֵת is both the direct-object marker and "with", identical pointing, different
 * Strong's — so keying the subsection map by the written form would silently merge them and
 * a quiz could mark the wrong gloss correct.
 */

import bgvbData from '@/data/bgvb-vocabulary.json'
import hebrewData from '@/data/hebrew-vocabulary.json'

export interface DeckWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  /** Printed subsection key, e.g. "1-C". Greek only — the Hebrew deck chunks by 20. */
  sub?: string
  freq: number | null
  /** Printed frequency rank (1 = most frequent); orders words within a section. */
  order?: number
  /** Stable unique key. Absent on Greek (lemmas are unique); present on Hebrew homographs. */
  id?: string
}

export interface DeckSubsection {
  key: string       // "1-A"
  label: string     // "A"
  rankRange: string // "1–20", the words' positions within the section
  words: DeckWord[]
}

export interface Deck {
  lang: VocabLang
  words: DeckWord[]
  sections: number[]
  allPos: string[]
  subsections: Record<number, DeckSubsection[]>
  /** word id → its subsection key. */
  wordSubsection: Record<string, string>
  allSubsectionKeys: string[]
}

export type VocabLang = 'greek' | 'hebrew'

/** Identity of a deck entry. See the homograph note at the top of the file. */
export const wordId = (w: DeckWord): string => w.id ?? w.word

function buildDeck(lang: VocabLang, words: DeckWord[]): Deck {
  const sections = Array.from(new Set(words.map(w => w.section))).sort((a, b) => a - b)
  const allPos = Array.from(new Set(words.map(w => w.pos))).sort()
  const subsections: Record<number, DeckSubsection[]> = {}
  const wordSubsection: Record<string, string> = {}

  for (const s of sections) {
    const sectionWords = [...words.filter(w => w.section === s)].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return (b.freq ?? 0) - (a.freq ?? 0)
    })

    const subs: DeckSubsection[] = []
    // The printed handout's own grouping, where the deck carries one (Greek). A few of its
    // subsections hold 18–19 words because the sheet prints a dozen words twice and only the
    // first, more frequent placement is kept.
    const groups = new Map<string, DeckWord[]>()
    for (const w of sectionWords) {
      if (!w.sub) continue
      const list = groups.get(w.sub)
      if (list) list.push(w)
      else groups.set(w.sub, [w])
    }

    if (groups.size > 0) {
      let position = 1
      for (const key of Array.from(groups.keys()).sort()) {
        const chunk = groups.get(key)!
        subs.push({
          key,
          label: key.split('-')[1],
          rankRange: `${position}–${position + chunk.length - 1}`,
          words: chunk,
        })
        position += chunk.length
        for (const w of chunk) wordSubsection[wordId(w)] = key
      }
    } else {
      // No printed grouping (Hebrew): chunk by 20 in frequency order.
      for (let i = 0; i < sectionWords.length; i += 20) {
        const chunk = sectionWords.slice(i, i + 20)
        const label = String.fromCharCode(65 + subs.length) // A, B, C…
        const key = `${s}-${label}`
        subs.push({
          key, label,
          rankRange: `${i + 1}–${Math.min(i + 20, sectionWords.length)}`,
          words: chunk,
        })
        for (const w of chunk) wordSubsection[wordId(w)] = key
      }
    }
    subsections[s] = subs
  }

  return {
    lang,
    words,
    sections,
    allPos,
    subsections,
    wordSubsection,
    allSubsectionKeys: sections.flatMap(s => subsections[s].map(sub => sub.key)),
  }
}

export const GREEK_DECK  = buildDeck('greek',  bgvbData   as DeckWord[])
export const HEBREW_DECK = buildDeck('hebrew', hebrewData as DeckWord[])

export const DECKS: Record<VocabLang, Deck> = { greek: GREEK_DECK, hebrew: HEBREW_DECK }

/**
 * Collect a deck's words for a selection of subsection keys + parts of speech.
 * Empty `subsections` means "all sections"; empty `pos` means "all parts of speech".
 */
export function deckWordsForSelection(deck: Deck, subsections: string[], pos: string[]): DeckWord[] {
  const subSet = subsections.length > 0 ? new Set(subsections) : null
  const posSet = pos.length > 0 ? new Set(pos) : null
  return deck.words.filter(w => {
    if (subSet && !subSet.has(deck.wordSubsection[wordId(w)])) return false
    if (posSet && !posSet.has(w.pos)) return false
    return true
  })
}

/**
 * Every subsection key that comes BEFORE the earliest of `subsections` in the deck's own
 * frequency order — the material already covered by the time a student reaches this
 * selection. Empty if nothing precedes it, or if `subsections` is empty ("all sections").
 */
export function deckKeysBefore(deck: Deck, subsections: string[]): string[] {
  if (subsections.length === 0) return []
  const idx = subsections
    .map(k => deck.allSubsectionKeys.indexOf(k))
    .filter(i => i >= 0)
  if (idx.length === 0) return []
  return deck.allSubsectionKeys.slice(0, Math.min(...idx))
}
