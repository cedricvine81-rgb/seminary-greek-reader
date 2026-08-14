/**
 * Built-in quiz-series presets — series recipes that ship with the app.
 *
 * The instructor's saved templates (/api/series-templates) answer "rebuild MY series next
 * term". These answer "give me the standard series for this course" on a fresh account:
 * they appear in the same template list, are applied by the same code path, and produce
 * ordinary assignments an instructor can then edit test by test. Nothing downstream knows
 * a preset exists — the semester route receives the same morphologySeries it always has.
 *
 * THE BEGINNING HEBREW SERIES follows the OTST 551 progression (Kelley; the BibleOL
 * exercises the course sets mirror the same order): nominals first, then the strong-verb
 * ladder — perfect, imperfect, the narrative tenses, volitives, and finally the
 * non-finite forms. Every verb quiz is filtered to rootClasses: ['Strong'], which is the
 * point of the series: first-year students parse the regular verb only, and an
 * unfiltered pool deals them weak forms five to one (see quiz-fields-hebrew.ts).
 *
 * Field lists respect what each conjugation carries — infinitives take stem+conjugation
 * only, participles swap person for state — because the generator drops forms that lack
 * a tested field, and asking for person on an infinitive quiz would empty it.
 */
import type { MorphTestConfig } from './quiz-fields'
import type { HebrewMorphParseFilter } from './quiz-fields-hebrew'

export interface SeriesPreset {
  /** Stable id, used as the option value; never shown. */
  id: string
  /** Listed name. The i18n key `inst.b.s.preset.<id>` overrides it where translated. */
  name: string
  quizType: 'MORPHOLOGY_QUIZ'
  /** Which course levels the preset is offered for. */
  levels: string[]
  config: {
    seriesName: string
    morphologySeries: MorphTestConfig[]
  }
}

/** All seven first-year stems; the rare poetic stems stay out of a beginner's quiz. */
const STEMS7 = ['Qal', 'Niphal', 'Piel', 'Pual', 'Hiphil', 'Hophal', 'Hithpael']

const FINITE = ['stem', 'conjugation', 'person', 'gender', 'number']

/**
 * A Hebrew verb test: strong roots only, one topic, one slice of the conjugation ladder.
 *
 * The filter names ONLY what it restricts. An omitted field means "no restriction" — and
 * writing the full value list instead would freeze today's pool vocabulary into the
 * stored morphConfig, so a future pool rebuild that renames or adds a value would
 * silently narrow every regenerated quiz.
 */
function verbTest(
  topic: string, stems: string[], conjugations: string[], fields: string[] = FINITE,
): MorphTestConfig {
  const parseFilter: HebrewMorphParseFilter = { stems, conjugations, rootClasses: ['Strong'] }
  return {
    subtype: 'VERB_PARSING', numQuestions: 20,
    vocabThruLesson: null, vocabAuto: false,
    fields, topic,
    // The Hebrew filter shape rides the same field the Greek one does; the server and the
    // per-assignment editor already branch on the course level.
    parseFilter: parseFilter as MorphTestConfig['parseFilter'],
  }
}

/** A nominal test restricts nothing — the whole pool for its part of speech is fair. */
function nominalTest(
  subtype: MorphTestConfig['subtype'], topic: string, fields: string[],
): MorphTestConfig {
  return { subtype, numQuestions: 20, vocabThruLesson: null, vocabAuto: false, fields, topic }
}

export const SERIES_PRESETS: SeriesPreset[] = [
  {
    id: 'hebrew-beginning-morphology',
    name: 'Beginning Hebrew — morphology series (strong verb)',
    quizType: 'MORPHOLOGY_QUIZ',
    levels: ['HEBREW_BEGINNING'],
    config: {
      seriesName: 'Hebrew Morphology',
      morphologySeries: [
        // ── Section 1: nominal forms (Kelley L.7–L.11) ──────────────────────────
        nominalTest('NOUN_PARSING', 'Nouns — gender, number, state',
          ['gender', 'number', 'state']),
        nominalTest('ADJECTIVE_PARSING', 'Adjectives',
          ['gender', 'number', 'state']),
        nominalTest('PRONOUN_PARSING', 'Pronouns',
          ['type', 'person', 'gender', 'number']),
        // ── Section 2: the strong verb (Kelley L.12–L.20) ───────────────────────
        verbTest('Qal perfect', ['Qal'], ['Perfect']),
        verbTest('Perfect — all stems', STEMS7, ['Perfect']),
        verbTest('Qal imperfect', ['Qal'], ['Imperfect']),
        verbTest('Imperfect — all stems', STEMS7, ['Imperfect']),
        verbTest('Vav-consecutive narrative', STEMS7,
          ['Sequential imperfect', 'Sequential perfect']),
        verbTest('Imperative, jussive & cohortative', STEMS7,
          ['Imperative', 'Jussive', 'Cohortative']),
        // Infinitives carry no agreement at all: parse = stem + conjugation.
        verbTest('Infinitives — construct & absolute', STEMS7,
          ['Infinitive construct', 'Infinitive absolute'], ['stem', 'conjugation']),
        // Participles decline like adjectives: state replaces person.
        verbTest('Participles', STEMS7,
          ['Active participle', 'Passive participle'],
          ['stem', 'conjugation', 'gender', 'number', 'state']),
      ],
    },
  },
]

/** The presets offered for a course level (empty for Greek — its series are hand-built). */
export function presetsForLevel(level: string): SeriesPreset[] {
  return SERIES_PRESETS.filter(p => p.levels.includes(level))
}
