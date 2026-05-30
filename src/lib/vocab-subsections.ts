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

// Pre-compute subsections: 20-word chunks per section, sorted by PDF frequency rank.
// Words with an `order` field (1 = most frequent) sort ascending by order.
// Words without order fall after ranked words (freq desc as fallback).
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
  for (let i = 0; i < sectionWords.length; i += 20) {
    const chunk = sectionWords.slice(i, i + 20)
    const label = String.fromCharCode(65 + subs.length) // A, B, C…
    const start = i + 1
    const end = Math.min(i + 20, sectionWords.length)
    const key = `${s}-${label}`
    subs.push({ key, label, rankRange: `${start}–${end}`, words: chunk })
    chunk.forEach(w => { WORD_SUBSECTION[w.word] = key })
  }
  SECTION_SUBSECTIONS[s] = subs
})

export const ALL_SUBSECTION_KEYS = ALL_SECTIONS.flatMap(
  s => SECTION_SUBSECTIONS[s].map(sub => sub.key)
)
