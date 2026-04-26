import type { CourseLevel } from '@/types/course'

export const FREQUENCY_THRESHOLDS: Record<CourseLevel, number> = {
  BEGINNING: 50,
  INTERMEDIATE: 30,
}

export function getFrequencyLabel(level: CourseLevel): string {
  return `NT words occurring more than ${FREQUENCY_THRESHOLDS[level]} times`
}
