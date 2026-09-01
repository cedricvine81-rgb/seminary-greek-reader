import { weekDeadlines, normalizeActivityConfig } from './activity-log'

/**
 * The effective final deadline for an assignment's submission window.
 *
 * Two-round passage (translation) exercises close after the Round 2 (corrections)
 * deadline, not their dueDate (which is the Round 1 cut-off). Round deadlines are
 * only set on those exercises, so this falls back to dueDate for every other
 * assignment type without needing to know the question count.
 *
 * ACTIVITY_LOG runs until its LAST weekly deadline: its dueDate is the anchor the
 * weekly deadlines are generated from — i.e. week 1's date — so reading it as the
 * final deadline marked a 15-week report "Overdue" (and closed its submission
 * window) the moment week 1 passed, with fourteen weeks still to report.
 */
export function effectiveDeadline(a: {
  dueDate: Date
  round1Deadline: Date | null
  round2Deadline: Date | null
  type?: string
  activityConfig?: unknown
}): Date {
  if (a.type === 'ACTIVITY_LOG') {
    const deadlines = weekDeadlines(a.dueDate, normalizeActivityConfig(a.activityConfig))
    return new Date(deadlines[deadlines.length - 1])
  }
  return a.round2Deadline ?? a.round1Deadline ?? a.dueDate
}
