// HEBREW morphology-quiz field vocabulary, shared by the instructor UI and the generator.
//
// Deliberately free of any data import, for the same reason as the Greek quiz-fields.ts:
// the instructor builder is a client component and the pool must stay server-side.
//
// The value lists must match what scripts/build-hebrew-parsing-pool.py emits, which in turn
// mirrors the decoder in src/lib/hebrew-morph.ts — so a student meets one set of terms in
// the Reader's parsing pane and in the quiz.

import { SUBTYPE_FIELD_OPTIONS, type MorphFieldOption, type MorphologySubtype } from './quiz-fields'
import { isHebrewLevel } from './constants'
// Which values each parse field actually takes in the pool, regenerated alongside it by
// scripts/build-hebrew-parsing-pool.py. A few hundred bytes — safe in a client component,
// unlike the pool itself. See POOL_* below for why the two lists differ.
import poolValues from '@/data/hebrew-pool-values.json'

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
// No 'Both': OSHB's dual-gender tag is a lexical fact about the lemma, not something a
// student can read off the form, so the pool builder resolves it from the ending (or leaves
// the form untested for gender). See gender_from_ending in build-hebrew-parsing-pool.py.
export const HEBREW_GENDERS = ['Masculine', 'Feminine', 'Common']
// Hebrew has a dual, mostly on natural pairs (eyes, hands) and time words.
export const HEBREW_NUMBERS = ['Singular', 'Plural', 'Dual']
export const HEBREW_STATES  = ['Absolute', 'Construct', 'Determined']
export const HEBREW_PRONOUN_TYPES = ['Personal', 'Demonstrative', 'Relative', 'Interrogative', 'Indefinite']

/**
 * Root classes — the "regular verb" filter, and the one a first-year course needs most.
 *
 * A beginning syllabus spends its whole verb semester on the STRONG verb (Kelley L.12–L.20
 * are each headed "of the Strong Verb"), because a weak root's vowel changes only make
 * sense once the regular pattern is known. Strong verbs are about a seventh of the verbs
 * in the Hebrew Bible, so an unfiltered quiz is overwhelmingly forms the student has not
 * been taught: before this existed, a Qal-perfect quiz drew 18 weak forms in 20.
 *
 * 'Strong' first because that is the one a course asks for; the weak classes follow in the
 * order a grammar introduces them. Each form carries exactly one class — see root_class()
 * in scripts/build-hebrew-parsing-pool.py for why a root weak in two ways gets one label.
 */
export const HEBREW_ROOT_CLASSES = [
  'Strong', 'I-guttural', 'I-nun', 'I-yod/waw', 'II-guttural', 'Hollow', 'Geminate',
  'III-alef', 'III-he', 'III-guttural', 'Irregular',
]

/** Screen labels. 'Strong' is what a grammar calls it; 'regular' is what students say. */
export const HEBREW_ROOT_CLASS_LABELS: Record<string, string> = {
  'Strong':        'Strong (regular)',
  'I-guttural':    'I-guttural',
  'I-nun':         'I-nun (assimilating)',
  'I-yod/waw':     'I-yod / I-waw',
  'II-guttural':   'II-guttural',
  'Hollow':        'Hollow (II-waw/yod)',
  'Geminate':      'Geminate (doubled 3rd)',
  'III-alef':      'III-alef',
  'III-he':        'III-he',
  'III-guttural':  'III-guttural',
  'Irregular':     'Irregular / biliteral',
}

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
  /** Verbs only. See HEBREW_ROOT_CLASSES — the "regular verb" filter. */
  rootClasses?: string[]
}

// ── Level-aware selection ─────────────────────────────────────────────────────
// The instructor builder is one component serving both languages. These pick the right
// vocabulary from the course's level, so a Hebrew course is never offered tense/voice/mood.

/** The subtypes offered, in picker order. Hebrew has no Conditionals/Subjunctives set. */
export function morphSubtypesFor(level: string): string[] {
  return isHebrewLevel(level)
    ? ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED']
    : ['VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING',
       'CONDITIONALS', 'SUBJUNCTIVES', 'MIXED']
}

/** The parse fields tickable for a subtype, in the course's language. */
export function morphFieldOptionsFor(level: string, subtype: string): MorphFieldOption[] {
  if (isHebrewLevel(level)) {
    return HEBREW_SUBTYPE_FIELD_OPTIONS[subtype as HebrewMorphologySubtype]
      ?? HEBREW_SUBTYPE_FIELD_OPTIONS.VERB_PARSING
  }
  return SUBTYPE_FIELD_OPTIONS[subtype as MorphologySubtype] ?? []
}

// ── What the pool actually holds ──────────────────────────────────────────────
//
// TWO lists, deliberately:
//   • HEBREW_* above is the COMPLETE grammar, and is what the student's parsing dropdowns
//     offer. It must stay complete: a value in an answer key with no matching option is a
//     question the student cannot answer.
//   • POOL_* below is only what the corpus yields, and is what the INSTRUCTOR's filter
//     chips offer. A chip for a value the pool lacks silently narrows a quiz to nothing —
//     OSHB tags no relative or interrogative pronouns at all, so those chips promised
//     something undeliverable.
const pv = poolValues as Record<string, string[]>
export const POOL_STEMS         = pv.stem        ?? HEBREW_STEMS
export const POOL_CONJUGATIONS  = pv.conjugation ?? HEBREW_CONJUGATIONS
export const POOL_PERSONS       = pv.person      ?? HEBREW_PERSONS
export const POOL_GENDERS       = pv.gender      ?? HEBREW_GENDERS
export const POOL_NUMBERS       = pv.number      ?? HEBREW_NUMBERS
export const POOL_STATES        = pv.state       ?? HEBREW_STATES
export const POOL_PRONOUN_TYPES = pv.type        ?? HEBREW_PRONOUN_TYPES
export const POOL_ROOT_CLASSES  = pv.rootClass   ?? HEBREW_ROOT_CLASSES

/** Pool order is alphabetical; show root classes in teaching order, Strong first. */
export const POOL_ROOT_CLASSES_ORDERED = HEBREW_ROOT_CLASSES
  .filter(c => POOL_ROOT_CLASSES.includes(c))

/** Every value selected, i.e. no restriction — the starting state of the filter. */
export const HEBREW_DEFAULT_PARSE_FILTER: HebrewMorphParseFilter = {
  stems:        [...POOL_STEMS],
  conjugations: [...POOL_CONJUGATIONS],
  persons:      [...POOL_PERSONS],
  genders:      [...POOL_GENDERS],
  numbers:      [...POOL_NUMBERS],
  states:       [...POOL_STATES],
  types:        [...POOL_PRONOUN_TYPES],
  rootClasses:  [...POOL_ROOT_CLASSES],
}
