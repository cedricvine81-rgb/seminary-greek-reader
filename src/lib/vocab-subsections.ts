// The GREEK (BGVB) deck's subsection data, as consumed by VocabBuilder (study tab) and
// AssignmentBuilder (quiz config).
//
// The derivation itself now lives in vocab-decks.ts, which does the same work for the Hebrew
// deck. This module stays as the Greek-shaped view its callers already expect: same export
// names, same values. Greek lemmas are unique, so keying by headword and by deck id agree.

import { GREEK_DECK, deckWordsForSelection, deckKeysBefore, type DeckWord, type DeckSubsection } from './vocab-decks'

// ── Types ─────────────────────────────────────────────────────────────────────

/** @deprecated in new code — prefer DeckWord from vocab-decks. Kept: widely imported. */
export type BgvbWord = DeckWord
export type Subsection = DeckSubsection

// ── Constants ─────────────────────────────────────────────────────────────────

export const ALL_SECTIONS = GREEK_DECK.sections

export const SECTION_CUMULATIVE_COVERAGE: Record<number, number> = {
  1: 69.5, 2: 77.2, 3: 81.6, 4: 84.4, 5: 86.4, 6: 87.8, 7: 89.2,
}

export const SECTION_SUBSECTIONS: Record<number, Subsection[]> = GREEK_DECK.subsections
export const WORD_SUBSECTION: Record<string, string> = GREEK_DECK.wordSubsection
export const ALL_SUBSECTION_KEYS = GREEK_DECK.allSubsectionKeys
export const ALL_POS = GREEK_DECK.allPos

export const POS_LABELS: Record<string, string> = {
  Verb: 'Verb', Noun: 'Noun', Adj: 'Adjective', Adv: 'Adverb',
  Prep: 'Preposition', Conj: 'Conjunction', Pron: 'Pronoun',
  Art: 'Article', Interj: 'Interjection', Particle: 'Particle',
}

/**
 * Collect the BGVB words for a selection of subsection keys + parts of speech.
 * Empty `subsections` means "all sections"; empty `pos` means "all parts of speech".
 */
export function wordsForSelection(subsections: string[], pos: string[]): BgvbWord[] {
  return deckWordsForSelection(GREEK_DECK, subsections, pos)
}

/**
 * Every subsection key that comes BEFORE the earliest of `subsections` in BGVB
 * frequency order (1-A … 1-H, 2-A … 7-H) — i.e. the material a student has
 * already covered by the time they reach this selection. Empty if nothing
 * precedes it, or if `subsections` is empty (which means "all sections").
 */
export function subsectionKeysBefore(subsections: string[]): string[] {
  return deckKeysBefore(GREEK_DECK, subsections)
}
