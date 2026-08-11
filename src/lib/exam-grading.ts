// Shared grading math for Translation Exams, used by both the instructor grading UI
// (live totals) and the server (authoritative grade on save).
//
// Each passage is scored on three components — parsing, syntax, translation — and the
// passage grade is the weighted average of whichever sub-scores were entered, using the
// exam-wide weights. The exam total is the simple average of the passage grades.

export type GradeComponent = 'parsing' | 'syntax' | 'translation'
export const GRADE_COMPONENTS: GradeComponent[] = ['parsing', 'syntax', 'translation']
// The components' NAMES live in the catalogue under grade.component.* — four copies of them
// had accumulated, one of them in the same file that imported this map.

export interface GradeWeights { parsing: number; syntax: number; translation: number }
export const DEFAULT_WEIGHTS: GradeWeights = { parsing: 33, syntax: 33, translation: 34 }

export type PassageSubScores = { parsing?: number | null; syntax?: number | null; translation?: number | null }

/** Coerce an unknown (DB Json / form value) into usable weights, falling back to equal. */
export function normalizeWeights(raw: unknown): GradeWeights {
  const w = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw as Record<string, unknown> : {}
  const get = (k: GradeComponent) => {
    const n = Number(w[k])
    return isNaN(n) || n < 0 ? 0 : n
  }
  const out = { parsing: get('parsing'), syntax: get('syntax'), translation: get('translation') }
  if (out.parsing + out.syntax + out.translation === 0) return { ...DEFAULT_WEIGHTS }
  return out
}

/**
 * Weighted average of the entered sub-scores for one passage.
 * Returns null when no sub-score has been entered. Legacy number values
 * (Phase 2b, a single passage score) are passed through unchanged.
 */
export function passageGrade(scores: PassageSubScores | number | null | undefined, weights: GradeWeights): number | null {
  if (scores == null) return null
  if (typeof scores === 'number') return isNaN(scores) ? null : scores
  let wsum = 0
  let vsum = 0
  for (const c of GRADE_COMPONENTS) {
    const raw = scores[c]
    if (raw === null || raw === undefined) continue
    const v = Number(raw)
    if (isNaN(v)) continue
    const w = Number(weights[c]) || 0
    wsum += w
    vsum += w * v
  }
  if (wsum === 0) return null
  return vsum / wsum
}

/** Exam total = rounded average of the per-passage grades. Null when nothing is graded. */
export function examTotal(
  passageGrades: Record<string, PassageSubScores | number> | null | undefined,
  weights: GradeWeights,
): number | null {
  if (!passageGrades) return null
  const grades = Object.values(passageGrades)
    .map(s => passageGrade(s, weights))
    .filter((g): g is number => g !== null)
  if (grades.length === 0) return null
  return Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
}
