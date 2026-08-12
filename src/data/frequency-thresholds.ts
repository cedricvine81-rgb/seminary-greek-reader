import type { CourseLevel } from '@/types/course'
import { isHebrewLevel } from '@/lib/constants'

/**
 * The NT-frequency floor each GREEK course level draws its vocabulary from.
 *
 * Hebrew levels are listed so the record stays exhaustive, but the number is meaningless
 * for them: these are New Testament counts, and the Hebrew deck is banded by its own
 * source. Use getFrequencyLabel, which says so, rather than reading the number directly.
 */
export const FREQUENCY_THRESHOLDS: Record<CourseLevel, number> = {
  BEGINNING:    50,
  INTERMEDIATE: 30,
  ADVANCED:     30,
  GREEK_I:      50,
  GREEK_II:     30,
  GREEK_III:    30,
  SEPTUAGINT:   30,
  HEBREW_BEGINNING:    0,
  HEBREW_INTERMEDIATE: 0,
}

export function getFrequencyLabel(level: CourseLevel): string {
  // Naming an NT frequency for a Hebrew course would be simply false.
  if (isHebrewLevel(level)) return 'Hebrew vocabulary'
  return `NT words occurring more than ${FREQUENCY_THRESHOLDS[level]} times`
}
