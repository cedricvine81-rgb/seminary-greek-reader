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
import glanzBands from '@/data/hebrew-glanz-bands.json'

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
  /** Cumulative % of the deck's corpus covered through section N. */
  coverage: Record<number, number>
  /** What that corpus is called on screen: 'GNT' / 'the Hebrew Bible'. */
  corpusLabel: string
  /** Headword font class and direction, for any surface that prints the words. */
  scriptClass: string
  rtl: boolean
  /** 'Greek' / 'Hebrew' — used in labels like "Hebrew-English". */
  scriptName: string
  subsections: Record<number, DeckSubsection[]>
  /** word id → its subsection key. */
  wordSubsection: Record<string, string>
  allSubsectionKeys: string[]
  /** word id → Glanz band key ("Glanz 1F"). Hebrew only; absent on the Greek deck. */
  wordBand?: Record<string, string>
  /** The Glanz bands in order, for pickers. Hebrew only. */
  bands?: DeckSubsection[]
}

export type VocabLang = 'greek' | 'hebrew'

/** Identity of a deck entry. See the homograph note at the top of the file. */
export const wordId = (w: DeckWord): string => w.id ?? w.word

interface DeckMeta {
  coverage: Record<number, number>
  corpusLabel: string
  scriptClass: string
  rtl: boolean
  scriptName: string
}

function buildDeck(lang: VocabLang, words: DeckWord[], meta: DeckMeta): Deck {
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
    ...meta,
  }
}

// ── Glanz bands (Hebrew only) ────────────────────────────────────────────────────
//
// A SECOND grouping over the same deck, alongside the frequency sections. OTST 551 sets
// its weekly vocabulary as "Glanz 1F", which is a slice of a different frequency list
// (see scripts/build-glanz-bands.py), so it does not line up with our own §1–§7 at all.
// Both groupings are therefore offered and a selection may mix them: `wordSubsection`
// answers "which of our sections", `wordBand` answers "which Glanz band", and
// deckWordsForSelection consults both.
//
// Only the ranks come from Glanz. The glosses on these cards are ours.

/** The deck plus the seven words the corpus frequency pass structurally cannot see. */
function hebrewDeckWords(): DeckWord[] {
  const supplement = (glanzBands.supplement ?? []) as unknown as DeckWord[]
  // Given a section so they appear in the ordinary study lists too, not only in a band:
  // these are the commonest words in the Hebrew Bible, so §1 is where they belong.
  return [...(hebrewData as DeckWord[]), ...supplement.map(w => ({ ...w, section: 1 }))]
}

function withGlanzBands(deck: Deck): Deck {
  const ranks = glanzBands.ranks as Record<string, number>
  const bandOf = (rank: number) => `Glanz 1${'ABCDEFGHIJKL'[Math.floor((rank - 1) / 20)]}`
  const wordBand: Record<string, string> = {}
  for (const [id, rank] of Object.entries(ranks)) wordBand[id] = bandOf(rank)
  for (const s of glanzBands.supplement ?? []) {
    wordBand[(s as { id: string }).id] = bandOf((s as { glanzRank: number }).glanzRank)
  }
  const rankOf: Record<string, number> = { ...ranks }
  for (const s of glanzBands.supplement ?? []) {
    rankOf[(s as { id: string }).id] = (s as { glanzRank: number }).glanzRank
  }
  const inBand: Record<string, DeckWord[]> = {}
  for (const w of deck.words) {
    const band = wordBand[wordId(w)]
    if (band) (inBand[band] ??= []).push(w)
  }
  // Within a band, Glanz's own order — a student works down the list as he prints it.
  for (const list of Object.values(inBand)) {
    list.sort((a, b) => (rankOf[wordId(a)] ?? 0) - (rankOf[wordId(b)] ?? 0))
  }
  return {
    ...deck,
    wordBand,
    bands: (glanzBands._bands as string[]).map((b, i) => ({
      key: `Glanz ${b}`,
      label: b,
      // 20 words each, cumulative: band N is ranks (N-1)*20+1 … N*20.
      rankRange: `${i * 20 + 1}–${(i + 1) * 20}`,
      words: inBand[`Glanz ${b}`] ?? [],
    })),
  }
}

export const GREEK_DECK = buildDeck('greek', bgvbData as DeckWord[], {
  coverage: { 1: 69.5, 2: 77.2, 3: 81.6, 4: 84.4, 5: 86.4, 6: 87.8, 7: 89.2 },
  corpusLabel: 'GNT',
  scriptClass: 'greek-text',
  rtl: false,
  scriptName: 'Greek',
})
export const HEBREW_DECK = withGlanzBands(buildDeck('hebrew', hebrewDeckWords(), {
  coverage: { 1: 60.8, 2: 71.1, 3: 76.9, 4: 80.3, 5: 82.8, 6: 84.9, 7: 86.8 },
  corpusLabel: 'the Hebrew Bible',
  scriptClass: 'font-hebrew',
  rtl: true,
  scriptName: 'Hebrew',
}))

export const DECKS: Record<VocabLang, Deck> = { greek: GREEK_DECK, hebrew: HEBREW_DECK }

/**
 * Collect a deck's words for a selection of subsection keys + parts of speech.
 * Empty `subsections` means "all sections"; empty `pos` means "all parts of speech".
 */
export function deckWordsForSelection(deck: Deck, subsections: string[], pos: string[]): DeckWord[] {
  const subSet = subsections.length > 0 ? new Set(subsections) : null
  const posSet = pos.length > 0 ? new Set(pos) : null
  return deck.words.filter(w => {
    // A key may name one of OUR sections or a Glanz band; a selection may mix the two,
    // so a word is in scope if either grouping puts it there.
    if (subSet) {
      const id = wordId(w)
      if (!subSet.has(deck.wordSubsection[id]) && !subSet.has(deck.wordBand?.[id] ?? '')) {
        return false
      }
    }
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
