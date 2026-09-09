// Where a parse feature is taught: (field, value) -> grammar chapter, so the end-of-practice
// report can say not just "you missed the aorists" but "here is the chapter that teaches them".
//
// Most of this is not invented. The self-study ladders in self-study-morph.ts already say what
// each lesson drills, and self-study.ts already pairs lesson N with GREEK_CHAPTERS[N-1] /
// HEBREW_CHAPTERS[N-1]. Join the two and you get, for example, mood Subjunctive -> Greek lesson
// 15 -> the 'subjunctives' chapter. tests/morph-grammar-links.test.ts asserts every such entry
// still agrees with those registries, so reordering a chapter list fails the test rather than
// silently pointing students at the wrong page.
//
// The entries the ladder does NOT cover (individual tenses, voices, persons, cases) are chosen
// here and marked `derived: false`; they have no registry to check against.

export type MorphLang = 'greek' | 'hebrew'

export interface GrammarTarget {
  /** Chapter id in MAIN_TABS (Greek) / the Hebrew tab list — the ?chapter= value. */
  chapter: string
  /** true when the pairing comes from the self-study ladder and the test can verify it. */
  derived: boolean
}

const GREEK: Record<string, Record<string, GrammarTarget>> = {
  mood: {
    // Five lessons drill indicative forms (indicatives, contract-verbs, deponents,
    // 2nd-aorists, principal-parts), so this is the sensible default, not a fact the
    // ladder pins. Only moods taught in exactly one chapter are `derived`.
    Indicative:  { chapter: 'indicatives',  derived: false },
    Participle:  { chapter: 'participles',  derived: true },
    Subjunctive: { chapter: 'subjunctives', derived: true },
    Imperative:  { chapter: 'imperatives',  derived: true },
    Infinitive:  { chapter: 'infinitives',  derived: true },
  },
  tense: {
    // The ladder only pins the aorist (lesson 11). The rest go where their paradigms are
    // taught: present/imperfect/future with the indicative, the completed tenses with the
    // principal parts that form them.
    Aorist:     { chapter: '2nd-aorists',     derived: true },
    Present:    { chapter: 'indicatives',     derived: false },
    Imperfect:  { chapter: 'indicatives',     derived: false },
    Future:     { chapter: 'indicatives',     derived: false },
    Perfect:    { chapter: 'principal-parts', derived: false },
    Pluperfect: { chapter: 'principal-parts', derived: false },
  },
  voice: {
    Deponent:         { chapter: 'deponents',   derived: true },
    Active:           { chapter: 'indicatives', derived: false },
    Middle:           { chapter: 'indicatives', derived: false },
    Passive:          { chapter: 'indicatives', derived: false },
    'Middle/Passive': { chapter: 'indicatives', derived: false },
  },
  pronounType: {
    Personal:      { chapter: 'pronouns',       derived: true },
    Demonstrative: { chapter: 'demonstratives', derived: true },
    Relative:      { chapter: 'relatives',      derived: true },
    Interrogative: { chapter: 'pronouns',       derived: false },
    Indefinite:    { chapter: 'pronouns',       derived: false },
    Reflexive:     { chapter: 'pronouns',       derived: false },
    Reciprocal:    { chapter: 'pronouns',       derived: false },
    Correlative:   { chapter: 'pronouns',       derived: false },
  },
}

// Field-level fallbacks, used when the value has no entry of its own.
//
// Number and gender are shared between the verb and the nominal system, so the field name
// alone does not say where they are taught: "Plural" on a subjunctive is a finite verb ending
// (indicatives), while "Plural" on a noun is a declension (nouns). `context` — the rest of the
// parse — settles it. Without context we fall back to the nominal chapter.
const GREEK_BY_FIELD: Record<string, GrammarTarget> = {
  casus:  { chapter: 'nouns',       derived: true },
  gender: { chapter: 'nouns',       derived: true },
  number: { chapter: 'nouns',       derived: true },
  person: { chapter: 'indicatives', derived: false },
}
const GREEK_VERBAL_BY_FIELD: Record<string, GrammarTarget> = {
  number: { chapter: 'indicatives', derived: false },
  gender: { chapter: 'participles', derived: false },   // only participles carry gender
}

const HEBREW: Record<string, Record<string, GrammarTarget>> = {
  conjugation: {
    Perfect:                { chapter: 'qal-perfect',     derived: true },
    Imperfect:              { chapter: 'qal-imperfect',   derived: true },
    'Sequential imperfect': { chapter: 'waw-consecutive', derived: true },
    'Sequential perfect':   { chapter: 'waw-consecutive', derived: true },
    Imperative:             { chapter: 'volitives',       derived: true },
    Jussive:                { chapter: 'volitives',       derived: true },
    Cohortative:            { chapter: 'volitives',       derived: true },
    'Infinitive construct': { chapter: 'infinitives',     derived: true },
    'Infinitive absolute':  { chapter: 'infinitives',     derived: true },
    'Active participle':    { chapter: 'participles',     derived: true },
    'Passive participle':   { chapter: 'participles',     derived: true },
  },
  // Every stem past Qal has a chapter of its own.
  stem: {
    Qal:      { chapter: 'verb-system',    derived: false },
    Niphal:   { chapter: 'niphal',         derived: false },
    Piel:     { chapter: 'piel-pual',      derived: false },
    Pual:     { chapter: 'piel-pual',      derived: false },
    Hiphil:   { chapter: 'hiphil-hophal',  derived: false },
    Hophal:   { chapter: 'hiphil-hophal',  derived: false },
    Hithpael: { chapter: 'hithpael',       derived: false },
  },
}

const HEBREW_VERBAL_BY_FIELD: Record<string, GrammarTarget> = {
  number: { chapter: 'qal-perfect', derived: false },
  gender: { chapter: 'qal-perfect', derived: false },
}

const HEBREW_BY_FIELD: Record<string, GrammarTarget> = {
  state:  { chapter: 'construct',  derived: false },
  casus:  { chapter: 'nouns',      derived: true },
  gender: { chapter: 'nouns',      derived: true },
  number: { chapter: 'nouns',      derived: true },
  person: { chapter: 'qal-perfect', derived: false },
  // The Hebrew quiz calls the pronoun-type field `type`; the Greek one calls it
  // `pronounType`. Both are answered here so a caller can pass either through.
  type: { chapter: 'pronouns', derived: true },
  pronounType: { chapter: 'pronouns', derived: true },
}

/** A form is verbal if its parse carries a verb-only category. */
function isVerbal(context?: Record<string, string | null>): boolean {
  if (!context) return false
  return context.mood != null || context.tense != null
    || context.conjugation != null || context.stem != null
}

/**
 * The chapter that teaches this parse value, or null if we have nowhere sensible to send them.
 * `context` is the rest of the form's parse; pass it so shared fields (number, gender) resolve
 * to the verb chapter on a verb and the noun chapter on a noun.
 */
export function grammarTargetFor(
  lang: MorphLang, field: string, value: string,
  context?: Record<string, string | null>,
): GrammarTarget | null {
  const byValue = lang === 'greek' ? GREEK : HEBREW
  const byField = lang === 'greek' ? GREEK_BY_FIELD : HEBREW_BY_FIELD
  const verbal = lang === 'greek' ? GREEK_VERBAL_BY_FIELD : HEBREW_VERBAL_BY_FIELD
  if (byValue[field]?.[value]) return byValue[field][value]
  if (isVerbal(context) && verbal[field]) return verbal[field]
  return byField[field] ?? null
}

/**
 * Link into the grammar page for a parse value. `level` follows the course the student is on;
 * `track` flips the brand cookie in middleware, so a Hebrew link lands in the Hebrew reader.
 */
export function grammarHref(
  lang: MorphLang, field: string, value: string,
  level: 'beginning' | 'intermediate' = 'beginning',
  context?: Record<string, string | null>,
): string | null {
  const t = grammarTargetFor(lang, field, value, context)
  if (!t) return null
  // Matches how self-study.ts builds its grammar links: Greek carries the level, Hebrew does
  // not (its beginning/intermediate split is by chapter range, not a query param).
  return lang === 'greek'
    ? `/grammar?chapter=${t.chapter}&level=${level}&track=greek`
    : `/grammar?chapter=${t.chapter}&track=hebrew`
}

/** Exposed for the drift test. */
export const _MAPS = { GREEK, GREEK_BY_FIELD, HEBREW, HEBREW_BY_FIELD }
