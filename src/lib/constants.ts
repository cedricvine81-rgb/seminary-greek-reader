export const APP_NAME = 'Seminary Greek'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const JWT_EXPIRY = '7d'
export const JWT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  // 7 days — must match JWT_EXPIRY
export const BCRYPT_ROUNDS = 12

export const VOCAB_FREQUENCY_THRESHOLDS = {
  BEGINNING: 50,
  INTERMEDIATE: 30,
} as const

// Lockdown exams: the lowest auto-submit threshold an instructor may set. A value of 1
// (or 2) means a single stray focus-loss — an OS notification, a glance at another
// window, a flaky-connection blip — ends the student's whole exam. Enforced both in the
// settings UI and at runtime, so a single violation can never auto-submit an exam.
export const MIN_LOCKDOWN_AUTOSUBMIT = 3

export const GNT_BOOKS = [
  { osisId: 'Matt', name: 'Matthew', abbrev: 'Matt', chapters: 28 },
  { osisId: 'Mark', name: 'Mark', abbrev: 'Mark', chapters: 16 },
  { osisId: 'Luke', name: 'Luke', abbrev: 'Luke', chapters: 24 },
  { osisId: 'John', name: 'John', abbrev: 'John', chapters: 21 },
  { osisId: 'Acts', name: 'Acts', abbrev: 'Acts', chapters: 28 },
  { osisId: 'Rom', name: 'Romans', abbrev: 'Rom', chapters: 16 },
  { osisId: '1Cor', name: '1 Corinthians', abbrev: '1Cor', chapters: 16 },
  { osisId: '2Cor', name: '2 Corinthians', abbrev: '2Cor', chapters: 13 },
  { osisId: 'Gal', name: 'Galatians', abbrev: 'Gal', chapters: 6 },
  { osisId: 'Eph', name: 'Ephesians', abbrev: 'Eph', chapters: 6 },
  { osisId: 'Phil', name: 'Philippians', abbrev: 'Phil', chapters: 4 },
  { osisId: 'Col', name: 'Colossians', abbrev: 'Col', chapters: 4 },
  { osisId: '1Thess', name: '1 Thessalonians', abbrev: '1Thess', chapters: 5 },
  { osisId: '2Thess', name: '2 Thessalonians', abbrev: '2Thess', chapters: 3 },
  { osisId: '1Tim', name: '1 Timothy', abbrev: '1Tim', chapters: 6 },
  { osisId: '2Tim', name: '2 Timothy', abbrev: '2Tim', chapters: 4 },
  { osisId: 'Titus', name: 'Titus', abbrev: 'Titus', chapters: 3 },
  { osisId: 'Phlm', name: 'Philemon', abbrev: 'Phlm', chapters: 1 },
  { osisId: 'Heb', name: 'Hebrews', abbrev: 'Heb', chapters: 13 },
  { osisId: 'Jas', name: 'James', abbrev: 'Jas', chapters: 5 },
  { osisId: '1Pet', name: '1 Peter', abbrev: '1Pet', chapters: 5 },
  { osisId: '2Pet', name: '2 Peter', abbrev: '2Pet', chapters: 3 },
  { osisId: '1John', name: '1 John', abbrev: '1John', chapters: 5 },
  { osisId: '2John', name: '2 John', abbrev: '2John', chapters: 1 },
  { osisId: '3John', name: '3 John', abbrev: '3John', chapters: 1 },
  { osisId: 'Jude', name: 'Jude', abbrev: 'Jude', chapters: 1 },
  { osisId: 'Rev', name: 'Revelation', abbrev: 'Rev', chapters: 22 },
] as const

export const LXX_BOOKS = [
  { osisId: 'Gen', name: 'Genesis', abbrev: 'Gen', chapters: 50 },
  { osisId: 'Exod', name: 'Exodus', abbrev: 'Exod', chapters: 40 },
  { osisId: 'Lev', name: 'Leviticus', abbrev: 'Lev', chapters: 27 },
  { osisId: 'Num', name: 'Numbers', abbrev: 'Num', chapters: 36 },
  { osisId: 'Deut', name: 'Deuteronomy', abbrev: 'Deut', chapters: 34 },
  { osisId: 'Josh', name: 'Joshua', abbrev: 'Josh', chapters: 24 },
  { osisId: 'Judg', name: 'Judges', abbrev: 'Judg', chapters: 21 },
  { osisId: 'Ruth', name: 'Ruth', abbrev: 'Ruth', chapters: 4 },
  { osisId: '1Sam', name: '1 Samuel', abbrev: '1Sam', chapters: 31 },
  { osisId: '2Sam', name: '2 Samuel', abbrev: '2Sam', chapters: 24 },
  { osisId: '1Kgs', name: '1 Kings', abbrev: '1Kgs', chapters: 22 },
  { osisId: '2Kgs', name: '2 Kings', abbrev: '2Kgs', chapters: 25 },
  { osisId: 'Ps', name: 'Psalms', abbrev: 'Ps', chapters: 150 },
  { osisId: 'Prov', name: 'Proverbs', abbrev: 'Prov', chapters: 31 },
  { osisId: 'Eccl', name: 'Ecclesiastes', abbrev: 'Eccl', chapters: 12 },
  { osisId: 'Isa', name: 'Isaiah', abbrev: 'Isa', chapters: 66 },
  { osisId: 'Jer', name: 'Jeremiah', abbrev: 'Jer', chapters: 52 },
  { osisId: 'Ezek', name: 'Ezekiel', abbrev: 'Ezek', chapters: 48 },
  { osisId: 'Dan', name: 'Daniel', abbrev: 'Dan', chapters: 12 },
] as const

// Values only. Labels live in the shared course.level.* namespace — they were previously
// spelled three ways: here, in COURSE_LEVEL_LABELS below, and in CourseForm's own list, which
// offered three of the seven and called BEGINNING "Beginner".
export const COURSE_LEVELS = [
  'BEGINNING', 'INTERMEDIATE', 'ADVANCED', 'GREEK_I', 'GREEK_II', 'GREEK_III', 'SEPTUAGINT',
  'HEBREW_BEGINNING', 'HEBREW_INTERMEDIATE',
] as const
export type CourseLevel = typeof COURSE_LEVELS[number]

/**
 * Which language a course level is taught in. The unprefixed Greek values predate there
 * being a second language, so the mapping cannot be read off the name alone.
 *
 * Quiz generation MUST branch on this rather than on the level string: a Hebrew course
 * asking for vocabulary must not be served the Greek pool.
 */
export const COURSE_LEVEL_LANGUAGE: Record<CourseLevel, 'greek' | 'hebrew'> = {
  BEGINNING:           'greek',
  INTERMEDIATE:        'greek',
  ADVANCED:            'greek',
  GREEK_I:             'greek',
  GREEK_II:            'greek',
  GREEK_III:           'greek',
  SEPTUAGINT:          'greek',
  HEBREW_BEGINNING:    'hebrew',
  HEBREW_INTERMEDIATE: 'hebrew',
}

export const isHebrewLevel = (level: string): boolean =>
  COURSE_LEVEL_LANGUAGE[level as CourseLevel] === 'hebrew'

export const COURSE_LEVEL_VARIANTS: Record<string, 'blue' | 'purple' | 'green' | 'gray'> = {
  BEGINNING:    'blue',
  INTERMEDIATE: 'purple',
  ADVANCED:     'green',
  GREEK_I:      'blue',
  GREEK_II:     'purple',
  GREEK_III:    'green',
  SEPTUAGINT:   'gray',
  HEBREW_BEGINNING:    'blue',
  HEBREW_INTERMEDIATE: 'purple',
}

export const ASSIGNMENT_TYPES = [
  { value: 'VOCABULARY_QUIZ', label: 'Vocabulary Quiz' },
  { value: 'MORPHOLOGY_QUIZ', label: 'Morphology Quiz' },
  { value: 'TRANSLATION_EXERCISE', label: 'Translation Exercise' },
  { value: 'TRANSLATION_EXAM', label: 'Translation Exam' },
] as const

// Passage-based assignment types use the Exegesis workspace (word annotations +
// verse translation) rather than the quiz runner.
export const PASSAGE_ASSIGNMENT_TYPES = ['TRANSLATION_EXERCISE', 'TRANSLATION_EXAM'] as const
