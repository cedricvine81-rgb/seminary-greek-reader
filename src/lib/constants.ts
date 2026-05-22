export const APP_NAME = 'Seminary Greek'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const JWT_EXPIRY = '7d'
export const BCRYPT_ROUNDS = 12

export const VOCAB_FREQUENCY_THRESHOLDS = {
  BEGINNING: 50,
  INTERMEDIATE: 30,
} as const

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

export const COURSE_LEVELS = [
  { value: 'BEGINNING',    label: 'Beginning Greek' },
  { value: 'INTERMEDIATE', label: 'Intermediate Greek' },
  { value: 'ADVANCED',     label: 'Advanced Greek' },
  { value: 'GREEK_I',      label: 'Greek I' },
  { value: 'GREEK_II',     label: 'Greek II' },
  { value: 'GREEK_III',    label: 'Greek III' },
  { value: 'SEPTUAGINT',   label: 'Septuagint Greek' },
] as const

export const COURSE_LEVEL_LABELS: Record<string, string> = {
  BEGINNING:    'Beginning Greek',
  INTERMEDIATE: 'Intermediate Greek',
  ADVANCED:     'Advanced Greek',
  GREEK_I:      'Greek I',
  GREEK_II:     'Greek II',
  GREEK_III:    'Greek III',
  SEPTUAGINT:   'Septuagint Greek',
}

export const COURSE_LEVEL_VARIANTS: Record<string, 'blue' | 'purple' | 'green' | 'gray'> = {
  BEGINNING:    'blue',
  INTERMEDIATE: 'purple',
  ADVANCED:     'green',
  GREEK_I:      'blue',
  GREEK_II:     'purple',
  GREEK_III:    'green',
  SEPTUAGINT:   'gray',
}

export const ASSIGNMENT_TYPES = [
  { value: 'VOCABULARY_QUIZ', label: 'Vocabulary Quiz' },
  { value: 'MORPHOLOGY_QUIZ', label: 'Morphology Quiz' },
  { value: 'TRANSLATION_EXERCISE', label: 'Translation Exercise' },
] as const
