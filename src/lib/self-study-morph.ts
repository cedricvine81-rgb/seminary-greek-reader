// Morphology (parsing) practice quizzes for the self-study tracks.
//
// Each entry names WHAT a lesson's quiz drills (subtype + parse filter + tested fields)
// and HOW FAR the vocabulary schedule has reached by that lesson, so a parsing quiz never
// asks about a word the vocabulary steps haven't covered. The question pools are the same
// corpus-generated pools the instructor morphology quizzes use — but the pools are
// server-only (~840KB Greek / ~2MB Hebrew), so this registry is CONFIG ONLY, importable
// from the dashboard bundle: generation happens in /api/self-study/morph.
//
// Every config below was measured against the pools (2026-08-24): with its parse filter,
// tested-field requirement AND vocabulary cap applied, each leaves ≥25 real forms, so a
// 15-question quiz always fills (deponents, the thinnest, has 25).
//
// Greek quizzes cap vocabulary by BGVB lesson (lesson n ⇒ words through lesson min(n,16)).
// Hebrew NOMINAL quizzes cap by the cumulative Glanz band the vocab steps have reached;
// the Hebrew VERB quizzes deliberately run uncapped, for the reason series-presets.ts
// documents: the frequent verbs of Hebrew are almost all weak, so capping a strong-verb
// quiz by taught vocabulary empties it. Every prompt glosses its lexeme inline.
import type { MorphologySubtype, MorphParseFilter } from './quiz-fields'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from './quiz-fields-hebrew'

export const MORPH_QUIZ_QUESTIONS = 15
export const MORPH_PASS_PCT = 80

export interface GreekMorphQuizDef {
  lang: 'greek'
  labelKey: string
  /** Pools to draw from, with per-pool question counts (summing to the quiz length). */
  subtypes: { subtype: MorphologySubtype; count: number }[]
  fields?: string[]
  parseFilter?: MorphParseFilter
  /** Restrict to lexemes with this (accent-stripped) ending — contract / μι verbs. */
  lexemeEnding?: 'contract' | 'mi'
  /** BGVB vocabulary cap (null only for the sentence-based conditionals quiz). */
  vocabThruLesson: number | null
}

export interface HebrewMorphQuizDef {
  lang: 'hebrew'
  labelKey: string
  subtype: HebrewMorphologySubtype
  fields: string[]
  parseFilter?: HebrewMorphParseFilter
  /** Cumulative Glanz-band vocabulary cap ("Glanz 1E"). Verb quizzes: none (see above). */
  vocabThruBand?: string
}

export type MorphQuizDef = GreekMorphQuizDef | HebrewMorphQuizDef

const FINITE = ['tense', 'voice', 'mood', 'person', 'number']

/** `fields: null` = no field restriction (full parse of whatever each form carries). */
function greekVerbs(
  labelKey: string, lesson: number, parseFilter: MorphParseFilter,
  fields: string[] | null = FINITE, lexemeEnding?: GreekMorphQuizDef['lexemeEnding'],
): GreekMorphQuizDef {
  return {
    lang: 'greek', labelKey, fields: fields ?? undefined, parseFilter, lexemeEnding,
    subtypes: [{ subtype: 'VERB_PARSING', count: MORPH_QUIZ_QUESTIONS }],
    vocabThruLesson: Math.min(lesson, 16),
  }
}

/** Greek Beginning: lesson number (= chapter position) → parsing quiz. Lessons without an
 *  entry (pronunciation, the parsing overview, prepositions, liquids) have no distinct
 *  form pool to drill. */
export const GREEK_MORPH_QUIZZES: Record<number, GreekMorphQuizDef> = {
  // Nouns/Adj. chapter — both nominal pools, first-declension vocabulary only so far.
  3: {
    lang: 'greek', labelKey: 'ss.m.gk3',
    subtypes: [{ subtype: 'NOUN_PARSING', count: 10 }, { subtype: 'ADJECTIVE_PARSING', count: 5 }],
    fields: ['casus', 'gender', 'number'], vocabThruLesson: 3,
  },
  // The pronoun ladder mirrors the chapter sequence: personal → +demonstrative → all types.
  // Pronouns parse by case/gender/number, like nouns — never by person (that's a verb
  // category; the lexeme in the prompt already identifies ἐγώ vs σύ). Gender is a SOFT
  // field: ἐγώ / σύ forms carry none and simply skip the gender select, while the αὐτός
  // forms are asked for it (see parseEntriesToQuestions).
  5: {
    lang: 'greek', labelKey: 'ss.m.gk5',
    subtypes: [{ subtype: 'PRONOUN_PARSING', count: MORPH_QUIZ_QUESTIONS }],
    fields: ['casus', 'gender', 'number'],
    parseFilter: { pronounTypes: ['Personal'] }, vocabThruLesson: 5,
  },
  6: {
    lang: 'greek', labelKey: 'ss.m.gk6',
    subtypes: [{ subtype: 'PRONOUN_PARSING', count: MORPH_QUIZ_QUESTIONS }],
    fields: ['casus', 'gender', 'number'],
    parseFilter: { pronounTypes: ['Demonstrative'] }, vocabThruLesson: 6,
  },
  7: {
    lang: 'greek', labelKey: 'ss.m.gk7',
    subtypes: [{ subtype: 'PRONOUN_PARSING', count: MORPH_QUIZ_QUESTIONS }],
    fields: ['casus', 'gender', 'number', 'pronounType'],
    parseFilter: { pronounTypes: ['Personal', 'Demonstrative', 'Relative'] }, vocabThruLesson: 7,
  },
  8:  greekVerbs('ss.m.gk8',  8,  { moods: ['Indicative'] }),
  9:  greekVerbs('ss.m.gk9',  9,  { moods: ['Indicative'] }, FINITE, 'contract'),
  10: greekVerbs('ss.m.gk10', 10, { moods: ['Indicative'], voices: ['Deponent'] }),
  11: greekVerbs('ss.m.gk11', 11, { moods: ['Indicative'], tenses: ['Aorist'] }),
  13: greekVerbs('ss.m.gk13', 13, { moods: ['Indicative'] }),
  14: greekVerbs('ss.m.gk14', 14, { moods: ['Participle'] },
    ['tense', 'voice', 'casus', 'number', 'gender']),
  15: greekVerbs('ss.m.gk15', 15, { moods: ['Subjunctive'] }),
  16: greekVerbs('ss.m.gk16', 16, { moods: ['Imperative'] }),
  17: greekVerbs('ss.m.gk17', 17, { moods: ['Infinitive'] }, ['tense', 'voice', 'mood']),
  // μι-verbs appear in every mood, so the full parse of whatever the form carries.
  18: greekVerbs('ss.m.gk18', 18, {}, null, 'mi'),
  // Sentence-based multiple choice (conditional types) — no parse fields, no vocab cap.
  19: {
    lang: 'greek', labelKey: 'ss.m.gk19',
    subtypes: [{ subtype: 'CONDITIONALS', count: MORPH_QUIZ_QUESTIONS }],
    vocabThruLesson: null,
  },
  // Grand review: every pool, full parse, the whole Beginning vocabulary.
  20: {
    lang: 'greek', labelKey: 'ss.m.gk20',
    subtypes: [{ subtype: 'MIXED', count: MORPH_QUIZ_QUESTIONS }],
    vocabThruLesson: 16,
  },
}

/** All seven first-year stems (the rare poetic stems stay out — see series-presets.ts). */
const STEMS7 = ['Qal', 'Niphal', 'Piel', 'Pual', 'Hiphil', 'Hophal', 'Hithpael']
const HB_FINITE = ['stem', 'conjugation', 'person', 'gender', 'number']

function hebrewVerbs(
  labelKey: string, conjugations: string[], stems: string[] = STEMS7,
  fields: string[] = HB_FINITE,
): HebrewMorphQuizDef {
  // Strong roots only, like the instructor series: an unfiltered pool deals a first-year
  // student weak forms five to one.
  return {
    lang: 'hebrew', labelKey, subtype: 'VERB_PARSING', fields,
    parseFilter: { stems, conjugations, rootClasses: ['Strong'] },
  }
}

/** Hebrew Beginning: lesson number (= chapter position, 1–17) → parsing quiz. */
export const HEBREW_MORPH_QUIZZES: Record<number, HebrewMorphQuizDef> = {
  5: {
    lang: 'hebrew', labelKey: 'ss.m.hb5', subtype: 'NOUN_PARSING',
    fields: ['gender', 'number', 'state'], vocabThruBand: 'Glanz 1E',
  },
  7: {
    lang: 'hebrew', labelKey: 'ss.m.hb7', subtype: 'ADJECTIVE_PARSING',
    fields: ['gender', 'number', 'state'], vocabThruBand: 'Glanz 1G',
  },
  8: {
    lang: 'hebrew', labelKey: 'ss.m.hb8', subtype: 'PRONOUN_PARSING',
    fields: ['type', 'person', 'gender', 'number'], vocabThruBand: 'Glanz 1H',
  },
  12: hebrewVerbs('ss.m.hb12', ['Perfect'], ['Qal']),
  13: hebrewVerbs('ss.m.hb13', ['Imperfect'], ['Qal']),
  14: hebrewVerbs('ss.m.hb14', ['Sequential imperfect', 'Sequential perfect']),
  15: hebrewVerbs('ss.m.hb15', ['Imperative', 'Jussive', 'Cohortative']),
  // Infinitives carry no agreement: parse = stem + conjugation.
  16: hebrewVerbs('ss.m.hb16', ['Infinitive construct', 'Infinitive absolute'], STEMS7,
    ['stem', 'conjugation']),
  // Participles decline like adjectives: state replaces person.
  17: hebrewVerbs('ss.m.hb17', ['Active participle', 'Passive participle'], STEMS7,
    ['stem', 'conjugation', 'gender', 'number', 'state']),
}

/** The morphology quiz for a track's lesson, if that lesson has one. */
export function morphQuizFor(trackId: string, lesson: number): MorphQuizDef | null {
  if (trackId === 'greek-beginning') return GREEK_MORPH_QUIZZES[lesson] ?? null
  if (trackId === 'hebrew-beginning') return HEBREW_MORPH_QUIZZES[lesson] ?? null
  return null
}

/** Progress-store key for a track lesson's morphology quiz step. */
export function morphKeyFor(trackId: string, lesson: number): string {
  return trackId === 'hebrew-beginning' ? `ssm-hb-${lesson}` : `ssm-gb-${lesson}`
}
