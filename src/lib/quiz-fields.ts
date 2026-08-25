// Morphology-quiz field/filter vocabulary, shared by the instructor UI and the generator.
//
// Deliberately free of any data import: the instructor builder is a client component, and
// the question pool (src/data/greek-parsing-pool.json, ~840KB) must stay server-side.
// '@/lib/quiz-generation' re-exports everything here for server callers.

export type MorphologySubtype =
  | 'VERB_PARSING'
  | 'NOUN_PARSING'
  | 'ADJECTIVE_PARSING'
  | 'PRONOUN_PARSING'
  | 'CONDITIONALS'
  | 'SUBJUNCTIVES'
  | 'MIXED'

export interface MorphFieldOption {
  key: string
  label: string
}

// ── Value lists (must match what scripts/build-parsing-pool.py emits) ────────────────
export const VERB_TENSES = ['Present', 'Imperfect', 'Future', 'Aorist', 'Perfect', 'Pluperfect']
// "Deponent" is a tagged voice in the corpus (middle/passive in form, active in meaning) and
// covers many common NT verbs (ἔρχομαι, γίνομαι …), so it is offered alongside the three voices.
export const VERB_VOICES = ['Active', 'Middle', 'Passive', 'Middle/Passive', 'Deponent']
// Optative is excluded by design.
export const VERB_MOODS = ['Indicative', 'Subjunctive', 'Imperative', 'Infinitive', 'Participle']
export const PERSONS = ['1st', '2nd', '3rd']
export const NUMBERS = ['Singular', 'Plural']
export const NOUN_CASES = ['Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative']
export const GENDERS = ['Masculine', 'Feminine', 'Neuter']
export const PRONOUN_TYPES = ['Personal', 'Demonstrative', 'Relative', 'Interrogative',
  'Indefinite', 'Reflexive', 'Reciprocal', 'Correlative']

/**
 * Which parse fields may be tested for each subtype.
 *
 * Verbs are mood-dependent, so the verb list is the union and the generator keeps only the
 * forms that actually carry every selected field:
 *   • finite (Ind/Subj/Impv) → tense, voice, mood, person, number
 *   • participle             → tense, voice, mood, case, number, gender  (never person)
 *   • infinitive             → tense, voice, mood
 * So ticking Case+Gender yields a participle-only quiz; ticking Person excludes participles.
 */
export const SUBTYPE_FIELD_OPTIONS: Record<MorphologySubtype, MorphFieldOption[]> = {
  VERB_PARSING: [
    { key: 'tense',  label: 'Tense'  },
    { key: 'voice',  label: 'Voice'  },
    { key: 'mood',   label: 'Mood'   },
    { key: 'person', label: 'Person' },
    { key: 'number', label: 'Number' },
    { key: 'casus',  label: 'Case (participles)'   },
    { key: 'gender', label: 'Gender (participles)' },
  ],
  NOUN_PARSING: [
    { key: 'casus',  label: 'Case'   },
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
  ],
  ADJECTIVE_PARSING: [
    { key: 'casus',  label: 'Case'   },
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
  ],
  // Pronouns parse like nouns/adjectives: case, gender, number (+ the lexical type).
  // Person is NOT a pronoun category in this course (and the pool carries none) — the
  // lexeme (shown in the prompt) already says whether it is ego or su. Gender is
  // skipped automatically on the forms that have none: a null field is never asked.
  PRONOUN_PARSING: [
    { key: 'casus',       label: 'Case'   },
    { key: 'gender',      label: 'Gender' },
    { key: 'number',      label: 'Number' },
    { key: 'pronounType', label: 'Pronoun type' },
  ],
  MIXED: [
    { key: 'partOfSpeech', label: 'Part of Speech' },
    { key: 'tense',        label: 'Tense'          },
    { key: 'voice',        label: 'Voice'          },
    { key: 'mood',         label: 'Mood'           },
    { key: 'person',       label: 'Person'         },
    { key: 'number',       label: 'Number'         },
    { key: 'casus',        label: 'Case'           },
    { key: 'gender',       label: 'Gender'         },
  ],
  CONDITIONALS:  [],
  SUBJUNCTIVES:  [],
}

/**
 * Restrict which inflected forms appear in the question pool.
 * Each array is a whitelist; omit (or empty) means "all values allowed".
 */
export interface MorphParseFilter {
  // Verb
  tenses?:  string[]   // e.g. ['Present', 'Aorist']
  voices?:  string[]   // e.g. ['Active', 'Passive']
  moods?:   string[]   // e.g. ['Indicative', 'Subjunctive']
  persons?: string[]   // e.g. ['1st', '3rd']  — finite moods only
  numbers?: string[]   // e.g. ['Singular']
  // Participle / Noun / Adjective / Pronoun
  cases?:   string[]   // e.g. ['Nominative', 'Genitive']
  genders?: string[]   // e.g. ['Masculine']
  // Pronoun
  pronounTypes?: string[]  // e.g. ['Personal', 'Relative']
}

/** One test in a morphology series. */
export interface MorphTestConfig {
  subtype: MorphologySubtype
  numQuestions: number
  vocabThruLesson: number | null  // null = no vocabulary filter
  // true = follow the vocabulary schedule: week N is limited to words taught through lesson N
  vocabAuto?: boolean
  // HEBREW: cap forms to the vocabulary through this Glanz band ("Glanz 1F"). The Hebrew
  // deck has no BGVB lesson map, so vocabThruLesson cannot express its schedule. Null/
  // absent = no cap — which is the norm for strong-verb quizzes, where the cap would
  // empty the pool (strong verbs and frequent verbs barely overlap).
  vocabThruBand?: string | null
  fields: string[]                // which parse fields students must identify
  parseFilter?: MorphParseFilter  // restrict question pool to specific forms
  // Optional label for the quiz title: "Week N — <series> (<topic>)". Falls back to the
  // subtype label.
  topic?: string
  // Noun quizzes: restrict to declensions (classified by lemma; see nounDeclension).
  declensions?: (1 | 2 | 3)[]
}
