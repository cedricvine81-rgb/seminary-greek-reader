import type { AssignmentType } from '@/types/assignment'

/**
 * How an assignment type is shown: its badge colour, and the option lists every form repeats.
 *
 * THE LABELS ARE NOT HERE — they are catalogue keys (assign.type.*, assign.typeShort.*), because
 * a label is language and this file is not. What lives here is the presentation that does not
 * change with language, plus the option lists that were being retyped.
 *
 * The badge colour had two identical three-entry maps (AssignmentTable, CopyAssignmentsPanel)
 * and the label had three DISAGREEING ones: 'Vocab'/'Morph'/'Trans', then
 * 'Vocabulary'/'Morphology'/'Translation', then a nine-entry map with 'Exam' and 'Notes'. Two of
 * the three covered only the oldest three types, so a course-notes or group-presentation
 * assignment fell through to `?? a.type` and rendered a badge reading GROUP_PRESENTATION.
 * Everything now goes through assign.typeShort.*, which has all eight.
 */
export type BadgeVariant = 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'gray'

export const ASSIGNMENT_TYPE_VARIANT: Record<string, BadgeVariant> = {
  VOCABULARY_QUIZ: 'blue',
  PASSAGE_VOCABULARY: 'blue',
  MORPHOLOGY_QUIZ: 'purple',
  TRANSLATION_EXERCISE: 'green',
  TRANSLATION_EXAM: 'red',
  COURSE_NOTES: 'amber',
  GROUP_PRESENTATION: 'amber',
  CONSTRUCT_SEARCH: 'gray',
}

type T = (key: string, vars?: Record<string, string | number>) => string

/** The short badge name for a type. Unknown types show their raw value rather than nothing. */
export function assignmentTypeShort(type: string, t: T): string {
  const key = `assign.typeShort.${type}`
  const out = t(key)
  return out === key ? type : out
}

/** What a single assignment can be. PASSAGE_VOCABULARY is generated, never authored. */
export const SINGLE_ASSIGNMENT_TYPES: AssignmentType[] = [
  'VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ', 'TRANSLATION_EXERCISE', 'TRANSLATION_EXAM',
  'COURSE_NOTES', 'GROUP_PRESENTATION', 'CONSTRUCT_SEARCH',
]

/** A repeated series is always a quiz — the other types have no weekly form. */
export const SERIES_ASSIGNMENT_TYPES: AssignmentType[] = ['VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ']

/**
 * Retake, appeal and glossary choices. Offered identically by the builder (creating an
 * assignment) and the settings editor (changing one afterwards) — which had its own copy, so
 * adding an option meant remembering both.
 */
export const retakeOptions = (t: T) =>
  [0, 1, 2, 3, 5].map(n => ({ value: String(n), label: t(`inst.b.retakes${n}`) }))

export const appealOptions = (t: T) => [
  { value: '0', label: t('inst.b.appealsOff') },
  ...[1, 2, 3, 5].map(n => ({ value: String(n), label: t('inst.b.appealsN', { count: n, n }) })),
]

export const glossaryOptions = (t: T) => [
  { value: '', label: t('inst.b.glossaryOff') },
  { value: '50', label: t('inst.b.glossaryBeginner') },
  { value: '30', label: t('inst.b.glossaryIntermediate') },
]
