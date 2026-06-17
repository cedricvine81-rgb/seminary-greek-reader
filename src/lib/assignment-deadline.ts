/**
 * The effective final deadline for an assignment's submission window.
 *
 * Two-round passage (translation) exercises close after the Round 2 (corrections)
 * deadline, not their dueDate (which is the Round 1 cut-off). Round deadlines are
 * only set on those exercises, so this falls back to dueDate for every other
 * assignment type without needing to know the question count.
 */
export function effectiveDeadline(a: {
  dueDate: Date
  round1Deadline: Date | null
  round2Deadline: Date | null
}): Date {
  return a.round2Deadline ?? a.round1Deadline ?? a.dueDate
}
