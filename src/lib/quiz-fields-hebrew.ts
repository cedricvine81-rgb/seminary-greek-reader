// HEBREW morphology-quiz field vocabulary, shared by the instructor UI and the generator.
//
// Deliberately free of any data import, for the same reason as the Greek quiz-fields.ts:
// the instructor builder is a client component and the pool must stay server-side.
//
// The value lists must match what scripts/build-hebrew-parsing-pool.py emits, which in turn
// mirrors the decoder in src/lib/hebrew-morph.ts — so a student meets one set of terms in
// the Reader's parsing pane and in the quiz.

import type { MorphFieldOption } from './quiz-fields'

export type HebrewMorphologySubtype =
  | 'VERB_PARSING'
  | 'NOUN_PARSING'
  | 'ADJECTIVE_PARSING'
  | 'PRONOUN_PARSING'
  | 'MIXED'

// ── Value lists ───────────────────────────────────────────────────────────────
/**
 * The binyanim, commonest first. The long tail (Polel, Pilpel, Hishtaphel …) is real but
 * rare; it is offered so a filter can reach it, not because a course drills it.
 */
export const HEBREW_STEMS = [
  'Qal', 'Niphal', 'Piel', 'Pual', 'Hiphil', 'Hophal', 'Hithpael',
  'Qal passive', 'Polel', 'Polal', 'Poel', 'Poal', 'Palel', 'Palal', 'Pilpel', 'Polpal',
  'Hithpalpel', 'Nithpael', 'Pealal', 'Pilel', 'Hothpaal', 'Tiphil', 'Hishtaphel',
  'Hithpoel', 'Nithpoel',
]

/**
 * Conjugations. "Sequential imperfect" is the wayyiqtol (waw-consecutive) that carries
 * Hebrew narrative; "Sequential perfect" is the weqatal.
 */
export const HEBREW_CONJUGATIONS = [
  'Perfect', 'Imperfect', 'Sequential perfect', 'Sequential imperfect',
  'Imperative', 'Cohortative', 'Jussive',
  'Infinitive construct', 'Infinitive absolute',
  'Active participle', 'Passive participle',
]

export const HEBREW_PERSONS = ['1st', '2nd', '3rd']
// "Common" is a real value: 1st-person forms do not distinguish gender.
export const HEBREW_GENDERS = ['Masculine', 'Feminine', 'Common', 'Both']
// Hebrew has a dual, mostly on natural pairs (eyes, hands) and time words.
export const HEBREW_NUMBERS = ['Singular', 'Plural', 'Dual']
export const HEBREW_STATES  = ['Absolute', 'Construct', 'Determined']
export const HEBREW_PRONOUN_TYPES = ['Personal', 'Demonstrative', 'Relative', 'Interrogative', 'Indefinite']

/**
 * Which parse fields may be tested for each subtype.
 *
 * Verbs are conjugation-dependent, so the verb list is the union and the generator keeps
 * only forms that actually carry every selected field:
 *   • finite (perfect, imperfect, sequential, imperative, cohortative, jussive)
 *         → stem, conjugation, person, gender, number
 *   • participle → stem, conjugation, gender, number, state   (never person)
 *   • infinitive → stem, conjugation only
 * So ticking State yields a participle-only quiz; ticking Person excludes participles and
 * infinitives — the same rule the Greek verb subtype follows for moods.
 */
export const HEBREW_SUBTYPE_FIELD_OPTIONS: Record<HebrewMorphologySubtype, MorphFieldOption[]> = {
  VERB_PARSING: [
    { key: 'stem',        label: 'Stem (binyan)' },
    { key: 'conjugation', label: 'Conjugation'   },
    { key: 'person',      label: 'Person'        },
    { key: 'gender',      label: 'Gender'        },
    { key: 'number',      label: 'Number'        },
    { key: 'state',       label: 'State (participles)' },
  ],
  NOUN_PARSING: [
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
    { key: 'state',  label: 'State'  },
  ],
  ADJECTIVE_PARSING: [
    { key: 'gender', label: 'Gender' },
    { key: 'number', label: 'Number' },
    { key: 'state',  label: 'State'  },
  ],
  PRONOUN_PARSING: [
    { key: 'type',   label: 'Pronoun type' },
    { key: 'person', label: 'Person'       },
    { key: 'gender', label: 'Gender'       },
    { key: 'number', label: 'Number'       },
  ],
  MIXED: [
    { key: 'partOfSpeech', label: 'Part of speech' },
    { key: 'stem',         label: 'Stem (binyan)'  },
    { key: 'conjugation',  label: 'Conjugation'    },
    { key: 'person',       label: 'Person'         },
    { key: 'gender',       label: 'Gender'         },
    { key: 'number',       label: 'Number'         },
    { key: 'state',        label: 'State'          },
  ],
}

/** Default fields when the instructor ticks nothing, per subtype. */
export const HEBREW_DEFAULT_FIELDS: Record<HebrewMorphologySubtype, string[]> = {
  VERB_PARSING:      ['stem', 'conjugation', 'person', 'gender', 'number'],
  NOUN_PARSING:      ['gender', 'number', 'state'],
  ADJECTIVE_PARSING: ['gender', 'number', 'state'],
  PRONOUN_PARSING:   ['type', 'person', 'gender', 'number'],
  MIXED:             ['partOfSpeech', 'gender', 'number'],
}

/** Restrict a quiz to selected parse values (e.g. Qal + Piel only). */
export interface HebrewMorphParseFilter {
  stems?: string[]
  conjugations?: string[]
  persons?: string[]
  genders?: string[]
  numbers?: string[]
  states?: string[]
  types?: string[]
}
