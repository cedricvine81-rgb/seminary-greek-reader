import { isHebrewLevel } from '@/lib/constants'

/**
 * Which vocabulary a quiz row's "Word list" button should open.
 *
 * Shared by the two places a student meets an assignment list — the course card on the
 * dashboard (StudentCourseCard) and the standalone Assignments page (AssignmentList) — so the
 * two cannot drift. The reasoning below was expensive to arrive at and belongs in one place.
 *
 * Vocabulary quizzes only: the title regex must never grow a word-list button on a grammar
 * homework that happens to cite a section.
 *
 * NOT `vocabSelection.subsections`: that is the candidate POOL the generator may draw from, and
 * with cumulative review turned on every quiz in a course stores the same wide pool — in
 * Beginning Greek FA26 all sixteen of §1-A–§2-H, on week 1 as on week 14. Opening that pool
 * selected the whole of Beginning Greek and told the student nothing. The section that is new
 * this week is named in the TITLE ("Week 3 — Vocabulary Quiz (§1-C)"), which is the only place
 * it is recorded, so that is what the button honours. Falls back to the stored pool when a title
 * names nothing, which is no worse than before.
 */
export function vocabSubsectionsFor(a: {
  type: string
  title: string
  vocabSelection?: unknown
}): string[] {
  if (a.type !== 'VOCABULARY_QUIZ') return []
  const fromTitle = Array.from(a.title.matchAll(/§\s*(\d+-[A-Z])/g)).map(m => m[1])
  if (fromTitle.length) return fromTitle
  return ((a.vocabSelection ?? null) as { subsections?: string[] } | null)?.subsections ?? []
}

/**
 * Which deck that button opens. The section keys alone cannot decide it: the Greek and Hebrew
 * decks BOTH have a "1-C", so a Hebrew quiz handed to the default deck would open the Greek
 * §1-C without a single key being dropped.
 */
export function vocabLangFor(level: string): 'greek' | 'hebrew' {
  return isHebrewLevel(level) ? 'hebrew' : 'greek'
}
