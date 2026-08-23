// Final-grade weighting by assignment-type category for course gradebooks.
// Instructors assign a weight (percent) to each category (e.g. Vocabulary 40%,
// Translation Exercises 30%, Translation Exam 30%); the overall grade is the
// weighted average of the per-category averages. Weights are stored on the Course.

export type GradeCategory = 'VOCABULARY_QUIZ' | 'MORPHOLOGY_QUIZ' | 'TRANSLATION_EXERCISE' | 'TRANSLATION_EXAM' | 'COURSE_NOTES' | 'GROUP_PRESENTATION' | 'CONSTRUCT_SEARCH' | 'DIAGRAM'

// Types only. Labels live in the shared assign.type.* / assign.typePlural.* namespace, so a
// caller picks the number it needs instead of de-pluralizing a plural — GradeWeightEditor used
// to do that with `.replace(/ies$/, 'y').replace(/s$/, '')`, which is English morphology
// written into the app and produces nothing at all in Spanish.
export const GRADE_CATEGORIES: GradeCategory[] = [
  'VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ', 'TRANSLATION_EXERCISE', 'TRANSLATION_EXAM',
  'COURSE_NOTES', 'GROUP_PRESENTATION', 'CONSTRUCT_SEARCH', 'DIAGRAM',
]

export type CategoryWeights = Partial<Record<GradeCategory, number>>

/** Coerce a stored/posted value into clean positive weights, or null when none are set. */
export function normalizeCategoryWeights(raw: unknown): CategoryWeights | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const src = raw as Record<string, unknown>
  const out: CategoryWeights = {}
  for (const type of GRADE_CATEGORIES) {
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
