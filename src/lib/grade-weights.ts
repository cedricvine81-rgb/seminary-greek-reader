// Final-grade weighting by assignment-type category for course gradebooks.
// Instructors assign a weight (percent) to each category (e.g. Vocabulary 40%,
// Translation Exercises 30%, Translation Exam 30%); the overall grade is the
// weighted average of the per-category averages. Weights are stored on the Course.

export type GradeCategory = 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ' | 'TRANSLATION_EXERCISE' | 'TRANSLATION_EXAM' | 'COURSE_NOTES' | 'GROUP_PRESENTATION'

export const GRADE_CATEGORIES: { type: GradeCategory; label: string }[] = [
  { type: 'VOCABULARY_QUIZ',      label: 'Vocabulary Quizzes' },
  { type: 'MORPHOLOGY_QUIZ',      label: 'Morphology Quizzes' },
  { type: 'TRANSLATION_EXERCISE', label: 'Translation Exercises' },
  { type: 'TRANSLATION_EXAM',     label: 'Translation Exams' },
  { type: 'COURSE_NOTES',         label: 'Course Notes' },
  { type: 'GROUP_PRESENTATION',   label: 'Group Presentations' },
]

export type CategoryWeights = Partial<Record<GradeCategory, number>>

/** Coerce a stored/posted value into clean positive weights, or null when none are set. */
export function normalizeCategoryWeights(raw: unknown): CategoryWeights | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const src = raw as Record<string, unknown>
  const out: CategoryWeights = {}
  for (const { type } of GRADE_CATEGORIES) {
    const n = Number(src[type])
    if (!isNaN(n) && n > 0) out[type] = n
  }
  return Object.keys(out).length > 0 ? out : null
}

/**
 * Weighted overall from per-category averages. Returns null when no weighted
 * category has a score (caller may fall back to a flat average). Weights are
 * applied relatively, so they need not sum to 100, and categories with no score
 * are dropped (the remaining weights renormalise).
 */
export function weightedOverall(
  categoryAvgs: { type: GradeCategory; avg: number | null }[],
  weights: CategoryWeights,
): number | null {
  let wsum = 0
  let vsum = 0
  for (const { type, avg } of categoryAvgs) {
    if (avg === null) continue
    const w = weights[type] ?? 0
    if (w <= 0) continue
    wsum += w
    vsum += w * avg
  }
  if (wsum === 0) return null
  return Math.round(vsum / wsum)
}
