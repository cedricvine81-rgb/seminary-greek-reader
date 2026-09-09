// The vocabulary of a STUDENT-BUILT parsing drill: what they can choose, and what the choice
// is called. Client-safe by construction — like quiz-fields.ts it imports no pool data, since
// the builder is a client component and the corpus (~840KB Greek, ~2MB Hebrew) stays on the
// server. The counting and generating happen in /api/practice/morph.
import {
  VERB_TENSES, VERB_VOICES, VERB_MOODS, PERSONS, NUMBERS, NOUN_CASES, GENDERS, PRONOUN_TYPES,
  SUBTYPE_FIELD_OPTIONS, type MorphologySubtype,
} from '@/lib/quiz-fields'
import {
  HEBREW_SUBTYPE_FIELD_OPTIONS, HEBREW_DEFAULT_FIELDS, POOL_STEMS, POOL_CONJUGATIONS,
  POOL_PERSONS, POOL_GENDERS, POOL_NUMBERS, POOL_STATES, POOL_PRONOUN_TYPES,
  POOL_ROOT_CLASSES_ORDERED, type HebrewMorphologySubtype,
} from '@/lib/quiz-fields-hebrew'
import type { MorphLang } from '@/lib/morph-grammar-links'

/** Everything /api/practice/morph needs to count and to generate. */
export interface CustomMorphSpec {
  lang: MorphLang
  subtype: string
  /** Which parse fields the student will be asked for. */
  fields: string[]
  /** Whitelists per axis; an axis left out (or empty) means "any value". */
  parseFilter: Record<string, string[]>
  /** Greek: only words through this BGVB lesson. Null = the whole vocabulary. */
  vocabThruLesson?: number | null
  /** Hebrew: only words through this cumulative Glanz band. */
  vocabThruBand?: string | null
}

/** One selectable axis: the filter key it writes, and the values it offers. */
export interface MorphAxis {
  /** MorphParseFilter / HebrewMorphParseFilter key — 'tenses', 'stems'… */
  key: string
  /** The `morph.group.*` key its name is translated by (i18n/morph-labels.groupLabel), which
   *  is the vocabulary the reader, the parsing pane and the instructor builder already use —
   *  so "Case" is the same word everywhere. Values go through featureLabel the same way. */
  group: string
  values: string[]
}

// Only the axes a part of speech actually carries are offered, and this matters more than it
// looks: a filter clause restricts only the forms that CARRY the field, so a "Qal" chip on a
// noun drill would not narrow anything — it would look like a filter and do nothing.
const GREEK_AXES: Record<string, MorphAxis[]> = {
  VERB_PARSING: [
    { key: 'tenses',  group: 'tense',  values: VERB_TENSES },
    { key: 'voices',  group: 'voice',  values: VERB_VOICES },
    { key: 'moods',   group: 'mood',   values: VERB_MOODS },
    { key: 'persons', group: 'person', values: PERSONS },
    { key: 'numbers', group: 'number', values: NUMBERS },
    // Participles decline: these two narrow a verb drill to participles.
    { key: 'cases',   group: 'case',   values: NOUN_CASES },
    { key: 'genders', group: 'gender', values: GENDERS },
  ],
  NOUN_PARSING: [
    { key: 'cases',   group: 'case',   values: NOUN_CASES },
    { key: 'genders', group: 'gender', values: GENDERS },
    { key: 'numbers', group: 'number', values: NUMBERS },
  ],
  PRONOUN_PARSING: [
    { key: 'cases',        group: 'case',       values: NOUN_CASES },
    { key: 'genders',      group: 'gender',     values: GENDERS },
    { key: 'numbers',      group: 'number',     values: NUMBERS },
    { key: 'pronounTypes', group: 'pronounType', values: PRONOUN_TYPES },
  ],
}
GREEK_AXES.ADJECTIVE_PARSING = GREEK_AXES.NOUN_PARSING
GREEK_AXES.MIXED = [...GREEK_AXES.VERB_PARSING, GREEK_AXES.PRONOUN_PARSING[3]]

const HEBREW_AXES: Record<string, MorphAxis[]> = {
  VERB_PARSING: [
    { key: 'stems',        group: 'stem',        values: POOL_STEMS },
    { key: 'conjugations', group: 'conjugation', values: POOL_CONJUGATIONS },
    { key: 'persons',      group: 'person',      values: POOL_PERSONS },
    { key: 'genders',      group: 'gender',      values: POOL_GENDERS },
    { key: 'numbers',      group: 'number',      values: POOL_NUMBERS },
    { key: 'states',       group: 'state',       values: POOL_STATES },
    { key: 'rootClasses',  group: 'rootClass',   values: POOL_ROOT_CLASSES_ORDERED },
  ],
  NOUN_PARSING: [
    { key: 'genders', group: 'gender', values: POOL_GENDERS },
    { key: 'numbers', group: 'number', values: POOL_NUMBERS },
    { key: 'states',  group: 'state',  values: POOL_STATES },
  ],
  PRONOUN_PARSING: [
    { key: 'types',   group: 'pronounType', values: POOL_PRONOUN_TYPES },
    { key: 'persons', group: 'person',     values: POOL_PERSONS },
    { key: 'genders', group: 'gender',     values: POOL_GENDERS },
    { key: 'numbers', group: 'number',     values: POOL_NUMBERS },
  ],
}
HEBREW_AXES.ADJECTIVE_PARSING = HEBREW_AXES.NOUN_PARSING
HEBREW_AXES.MIXED = HEBREW_AXES.VERB_PARSING

/** The parts of speech a student may drill. Conditionals and Subjunctives are left out: they
 *  are sentence sets, not parse pools, so none of this vocabulary applies to them. */
export const PRACTICE_SUBTYPES = [
  'VERB_PARSING', 'NOUN_PARSING', 'ADJECTIVE_PARSING', 'PRONOUN_PARSING', 'MIXED',
] as const

/** Parse field -> the `morph.group.*` key that names it, so the builder, the quiz and the
 *  end-of-session report all call a field by the same word. */
export const FIELD_GROUPS: Record<string, string> = {
  tense: 'tense', voice: 'voice', mood: 'mood', person: 'person', number: 'number',
  casus: 'case', gender: 'gender', pronounType: 'pronounType', type: 'pronounType',
  stem: 'stem', conjugation: 'conjugation', state: 'state', partOfSpeech: 'pos',
}

export function axesFor(lang: MorphLang, subtype: string): MorphAxis[] {
  return (lang === 'hebrew' ? HEBREW_AXES : GREEK_AXES)[subtype] ?? []
}

/** The fields a student may ask to be tested on, for this part of speech. */
export function fieldsFor(lang: MorphLang, subtype: string): string[] {
  const opts = lang === 'hebrew'
    ? HEBREW_SUBTYPE_FIELD_OPTIONS[subtype as HebrewMorphologySubtype]
    : SUBTYPE_FIELD_OPTIONS[subtype as MorphologySubtype]
  return (opts ?? []).map(o => o.key)
}

/**
 * A sensible opening drill: the fields this part of speech is normally parsed by, with no
 * value restrictions.
 *
 * NOT every tickable field. A form must carry ALL the fields asked of it to be drawn, and the
 * tickable list is a union across moods: asking a Greek verb for case and gender narrows it to
 * participles, and asking a Hebrew verb for person AND state matches nothing at all (a
 * participle has no person, a finite verb no state). Both are legitimate choices — they are
 * just not a default, and a builder that opens on "no forms match" teaches nothing.
 *
 * Hebrew has an explicit default list already (HEBREW_DEFAULT_FIELDS, the instructor
 * builder's); Greek's is the tickable list minus the participle-only pair.
 */
export function defaultSpec(lang: MorphLang, subtype: string): CustomMorphSpec {
  const hebrewDefault = HEBREW_DEFAULT_FIELDS[subtype as HebrewMorphologySubtype]
  const fields = lang === 'hebrew' && hebrewDefault
    ? hebrewDefault.filter(f => f !== 'partOfSpeech')
    : fieldsFor(lang, subtype).filter(f => !(
        f === 'partOfSpeech'
        || (lang === 'greek' && (subtype === 'VERB_PARSING' || subtype === 'MIXED')
            && (f === 'casus' || f === 'gender'))
      ))
  return { lang, subtype, fields, parseFilter: {}, vocabThruLesson: null, vocabThruBand: null }
}

/**
 * Assignment.morphSubtype normalised to a generator subtype.
 *
 * Live rows carry the generator's own names (VERB_PARSING, MIXED, CONDITIONALS), but the
 * schema's comment long advertised short ones, so both are accepted here rather than trusted
 * anywhere. It matters: an unrecognised subtype falls through the generator's switch to the
 * VERB pool, which would quietly practise verbs for a noun quiz.
 */
const SUBTYPE_ALIASES: Record<string, string> = {
  VERB: 'VERB_PARSING', NOUN: 'NOUN_PARSING', ADJECTIVE: 'ADJECTIVE_PARSING',
  PRONOUN: 'PRONOUN_PARSING', CONDITIONAL: 'CONDITIONALS', SUBJUNCTIVE: 'SUBJUNCTIVES',
}

export function normaliseSubtype(subtype: string | null | undefined): string {
  if (!subtype) return 'MIXED'
  return SUBTYPE_ALIASES[subtype] ?? subtype
}

/** True when this subtype drills the parse pool, i.e. a custom drill of it can be built.
 *  The sentence sets (conditionals, subjunctive uses) are quizzes about usage, not forms. */
export const isParsePool = (subtype: string) =>
  (PRACTICE_SUBTYPES as readonly string[]).includes(normaliseSubtype(subtype))
