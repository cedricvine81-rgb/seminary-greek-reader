/**
 * Shared answer-matching utilities used by BOTH the server-side grader
 * (`src/lib/grading.ts`) and the client-side quiz UI (`QuizPlayer.tsx`).
 *
 * Keeping these in one place ensures the client's "correct?" feedback never
 * disagrees with the score the server actually records.
 */

/** Normalise an answer: trim, lowercase, strip terminal punctuation. */
export function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/[.,;:!?]/g, '').trim()
}

/** Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

/**
 * English negation prefixes that flip the meaning of an adjective/noun/verb.
 * Used to guard against fuzzy-matching antonyms (e.g. "unclean" vs "clean").
 *
 * Caveat: a few false positives are possible — e.g. "inflate" starts with "in" but
 * isn't a negation of "flate". The guard only fires when stripping the prefix
 * makes the two strings equal, which avoids those benign cases.
 */
const NEGATION_PREFIXES = ['un', 'non', 'dis', 'anti', 'mis', 'in', 'im', 'il', 'ir']

/** True when one of the two answers is the other prefixed by a negation. */
export function differsByNegation(a: string, b: string): boolean {
  // Without loss of generality: try treating `a` as the prefixed one, then `b`
  for (const [prefixed, base] of [[a, b], [b, a]]) {
    if (prefixed.length <= base.length) continue
    for (const p of NEGATION_PREFIXES) {
      if (prefixed.startsWith(p) && prefixed.slice(p.length) === base) return true
    }
  }
  return false
}

/**
 * Fuzzy match: tolerate a small number of typos scaled to word length.
 * Hard-rejects antonym pairs that differ only by a negation prefix
 * (e.g. "unclean" / "clean") — Levenshtein doesn't know what words mean.
 */
export function fuzzyMatch(student: string, expected: string): boolean {
  if (student === expected) return true
  if (differsByNegation(student, expected)) return false
  const maxLen = Math.max(student.length, expected.length)
  if (maxLen === 0) return true
  const allowed = maxLen <= 3 ? 0 : maxLen <= 6 ? 1 : 2
  return levenshtein(student, expected) <= allowed
}

/**
 * Returns true if `studentAnswer` matches `correctAnswer`.
 * `correctAnswer` may contain comma-separated acceptable alternatives.
 * When `fuzzy` is true, small typos are tolerated (used in "provide definition" mode).
 */
export function isAnswerCorrect(studentAnswer: string, correctAnswer: string, fuzzy = false): boolean {
  const student = normalise(studentAnswer)
  if (!student) return false
  // Accept either commas OR semicolons as separators between acceptable alternatives.
  // Lexicon glosses use both conventions (e.g. "love, affection" vs "I raise; I rise").
  const alts = correctAnswer.split(/[,;]/).map(a => normalise(a)).filter(Boolean)
  return fuzzy
    ? alts.some(alt => fuzzyMatch(student, alt))
    : alts.some(alt => alt === student)
}

/**
 * Match for MULTIPLE-CHOICE questions: the student picked a whole option, so it must
 * equal the full correct answer as-is. We must NOT split on commas here, because a
 * single gloss can itself contain a comma (e.g. "hope, expectation") — that's one
 * option, not two alternatives.
 */
export function isMultipleChoiceCorrect(studentAnswer: string, correctAnswer: string): boolean {
  return normalise(studentAnswer) === normalise(correctAnswer)
}
