// Hebrew morphology vocabulary for Construct search — the counterpart to morph-features.ts,
// which is Greek. The two share a shape (MorphGroup[] of value/label features) so one term-card
// UI can render either, but almost nothing else: Hebrew declines for STATE and conjugates by
// STEM, and has no case, voice or mood to speak of.
//
// Values are the lowercase tokens scripts/build-construct-index.mjs writes into the MT index's
// parsing strings (decoded there from OSHB codes, the same codes src/lib/hebrew-morph.ts renders
// for the parsing pane) — keep the three in step.

import type { MorphFeature, MorphGroup } from './morph-features'

const f = (value: string, label = value[0].toUpperCase() + value.slice(1)): MorphFeature => ({ value, label })

export const HEBREW_MORPH_GROUPS: MorphGroup[] = [
  // Each of the small function words is its own choice rather than a lumped "particle": for a
  // Hebrew student, "direct object marker" and "negative particle" are things you go looking for.
  { key: 'pos', label: 'Part of speech', features: [
    f('noun'), f('proper noun'), f('verb'), f('adjective'),
    f('preposition'), f('conjunction'), f('adverb'), f('article'),
    f('personal pronoun'), f('demonstrative pronoun'), f('relative pronoun'),
    f('interrogative pronoun'), f('indefinite pronoun'),
    f('pronominal suffix'), f('direct object marker'), f('negative particle'),
    f('relative particle'), f('interrogative particle'), f('demonstrative particle'),
    f('affirmation particle'), f('exhortation particle'), f('interjection'),
    f('cardinal number'), f('ordinal number'), f('gentilic noun'), f('gentilic adjective'),
    f('directional he'), f('paragogic he'), f('paragogic nun'),
  ] },
  // The binyanim, commonest first — the seven a student meets, then the rare ones.
  { key: 'stem', label: 'Stem (binyan)', features: [
    f('qal'), f('niphal'), f('piel'), f('pual'), f('hiphil'), f('hophal'), f('hithpael'),
    f('qal passive'), f('polel'), f('polal'), f('poel'), f('poal'), f('pilpel'), f('hithpalpel'),
    // Aramaic (Daniel, Ezra) uses its own names for the same slots.
    f('peal'), f('peil'), f('pael'), f('aphel'), f('haphel'), f('hithpeel'), f('hithpaal'), f('ithpaal'),
  ] },
  // OSHB's "conjugation" slot: the finite forms, the two infinitives, and the participles.
  { key: 'conjugation', label: 'Conjugation', features: [
    f('perfect'),
    f('sequential perfect', 'Sequential perfect (weqatal)'),
    f('imperfect'),
    f('sequential imperfect', 'Sequential imperfect (wayyiqtol)'),
    f('imperative'), f('cohortative'), f('jussive'),
    f('infinitive construct'), f('infinitive absolute'),
    f('active participle'), f('passive participle'),
  ] },
  { key: 'person', label: 'Person', features: [
    { value: '1 person', label: '1st' }, { value: '2 person', label: '2nd' }, { value: '3 person', label: '3rd' },
  ] },
  { key: 'gender', label: 'Gender', features: [
    f('masculine'), f('feminine'), f('common'), f('both genders', 'Both'),
  ] },
  { key: 'number', label: 'Number', features: [f('singular'), f('plural'), f('dual')] },
  // The category a construct chain turns on: a noun in the construct state is bound to what
  // follows it ("the word OF the LORD"), one in the absolute state stands free.
  { key: 'state', label: 'State', features: [
    f('construct'), f('absolute'), f('determined'),
  ] },
]

export const HEBREW_MORPH_GROUP_BY_KEY = new Map(HEBREW_MORPH_GROUPS.map(g => [g.key, g]))
export const HEBREW_ALL_FEATURES = new Set(HEBREW_MORPH_GROUPS.flatMap(g => g.features.map(x => x.value)))
export const HEBREW_FEATURE_LABEL = new Map(
  HEBREW_MORPH_GROUPS.flatMap(g => g.features.map(x => [x.value, x.label] as const)),
)

// What Hebrew words can agree in. Not case (there is none) — gender, number, and state, since
// definiteness/state agreement is what separates an attributive adjective from a predicate one.
export const HEBREW_AGREEMENT_CATEGORIES = ['gender', 'number', 'state'] as const

// Which categories apply to which part of speech, so the builder can't offer an impossible term
// (a noun with a stem, a preposition with a person).
const HEBREW_POS_CATEGORIES: Record<string, string[]> = {
  '':                      ['stem', 'conjugation', 'person', 'gender', 'number', 'state'],
  verb:                    ['stem', 'conjugation', 'person', 'gender', 'number', 'state'],
  noun:                    ['gender', 'number', 'state'],
  'proper noun':           ['gender', 'number'],
  adjective:               ['gender', 'number', 'state'],
  'gentilic noun':         ['gender', 'number', 'state'],
  'gentilic adjective':    ['gender', 'number', 'state'],
  'cardinal number':       ['gender', 'number', 'state'],
  'ordinal number':        ['gender', 'number', 'state'],
  'personal pronoun':      ['person', 'gender', 'number'],
  'demonstrative pronoun': ['gender', 'number'],
  'relative pronoun':      ['gender', 'number'],
  'interrogative pronoun': ['gender', 'number'],
  'indefinite pronoun':    ['gender', 'number'],
  'pronominal suffix':     ['person', 'gender', 'number'],
  // The rest are indeclinable: article, prepositions, conjunctions, the particles, the he's.
}

export function hebrewCategoriesFor(pos: string): MorphGroup[] {
  const keys = HEBREW_POS_CATEGORIES[pos] ?? (pos ? [] : HEBREW_POS_CATEGORIES[''])
  return keys.map(k => HEBREW_MORPH_GROUP_BY_KEY.get(k)).filter((g): g is MorphGroup => !!g)
}

export const HEBREW_POS_FEATURES = HEBREW_MORPH_GROUP_BY_KEY.get('pos')!.features
