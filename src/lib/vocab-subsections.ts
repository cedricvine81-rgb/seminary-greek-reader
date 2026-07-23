// Shared subsection data derived from bgvb-vocabulary.json.
// Imported by both VocabBuilder (study tab) and AssignmentBuilder (quiz config).

import bgvbData from '@/data/bgvb-vocabulary.json'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BgvbWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  sub?: string    // printed subsection key, e.g. "1-C" (absent on the Hebrew deck)
  freq: number | null
  order?: number  // PDF frequency rank (1 = most frequent)
}

export interface Subsection {
  key: string       // e.g. "1-A"
  label: string     // "A"
  rankRange: string // "1–20" (position within section)
  words: BgvbWord[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WORDS = bgvbData as BgvbWord[]

export const ALL_SECTIONS = [1, 2, 3, 4, 5, 6, 7]

export const SECTION_CUMULATIVE_COVERAGE: Record<number, number> = {
  1: 69.5, 2: 77.2, 3: 81.6, 4: 84.4, 5: 86.4, 6: 87.8, 7: 89.2,
}

// Pre-compute subsections. Words carry the subsection they are printed in (`sub`),
// taken straight from the BGVB handout, so the app's lists start and end on the same
// words as the printed sheet. A few subsections hold 18 or 19 words rather than 20 —
// the handout prints a dozen words in two places, and only the first (more frequent)
// placement is kept. Decks without `sub` (Hebrew) fall back to 20-word chunks.
export const SECTION_SUBSECTIONS: Record<number, Subsection[]> = {}
export const WORD_SUBSECTION: Record<string, string> = {}

ALL_SECTIONS.forEach(s => {
  const sectionWords = [...WORDS.filter(w => w.section === s)]
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return (b.freq ?? 0) - (a.freq ?? 0)
    })
  const subs: Subsection[] = []
  const groups = new Map<string, BgvbWord[]>()
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
      const label = key.split('-')[1]
      subs.push({ key, label, rankRange: `${position}–${position + chunk.length - 1}`, words: chunk })
      position += chunk.length
      chunk.forEach(w => { WORD_SUBSECTION[w.word] = key })
    }
  } else {
    for (let i = 0; i < sectionWords.length; i += 20) {
      const chunk = sectionWords.slice(i, i + 20)
      const label = String.fromCharCode(65 + subs.length) // A, B, C…
      const key = `${s}-${label}`
      subs.push({
        key, label,
        rankRange: `${i + 1}–${Math.min(i + 20, sectionWords.length)}`,
        words: chunk,
      })
      chunk.forEach(w => { WORD_SUBSECTION[w.word] = key })
    }
  }
  SECTION_SUBSECTIONS[s] = subs
})

export const ALL_SUBSECTION_KEYS = ALL_SECTIONS.flatMap(
  s => SECTION_SUBSECTIONS[s].map(sub => sub.key)
)

// All parts of speech present in the dataset (sorted), plus friendly labels.
// Shared by VocabBuilder and the vocab-quiz builder/generator.
export const ALL_POS = Array.from(new Set(WORDS.map(w => w.pos))).sort()

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
  const subSet = subsections.length > 0 ? new Set(subsections) : null
  const posSet = pos.length > 0 ? new Set(pos) : null
  return WORDS.filter(w => {
    if (subSet && !subSet.has(WORD_SUBSECTION[w.word])) return false
    if (posSet && !posSet.has(w.pos)) return false
    return true
  })
}

/**
 * Every subsection key that comes BEFORE the earliest of `subsections` in BGVB
 * frequency order (1-A … 1-H, 2-A … 7-H) — i.e. the material a student has
 * already covered by the time they reach this selection. Empty if nothing
 * precedes it, or if `subsections` is empty (which means "all sections").
 */
export function subsectionKeysBefore(subsections: string[]): string[] {
  if (subsections.length === 0) return []
  const idx = subsections
    .map(k => ALL_SUBSECTION_KEYS.indexOf(k))
    .filter(i => i >= 0)
  if (idx.length === 0) return []
  return ALL_SUBSECTION_KEYS.slice(0, Math.min(...idx))
}
