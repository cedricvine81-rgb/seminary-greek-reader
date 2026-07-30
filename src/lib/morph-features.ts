// Morphology feature vocabulary for the reader's "Search by morphology" picker.
// Values are the lowercased parsing tokens exactly as stored in word-index.json.gz, so
// they match server-side in searchByMorph (which token-matches the word's parsing string).

export interface MorphFeature { value: string; label: string }
export interface MorphGroup { key: string; label: string; features: MorphFeature[] }

const f = (value: string, label = value[0].toUpperCase() + value.slice(1)): MorphFeature => ({ value, label })

export const MORPH_GROUPS: MorphGroup[] = [
  { key: 'pos', label: 'Part of speech', features: [
    f('noun'), f('verb'), f('article'), f('adjective'), f('pronoun'),
    f('preposition'), f('conjunction'), f('adverb'), f('particle'), f('number'), f('interjection'),
  ] },
  { key: 'tense', label: 'Tense', features: [
    f('present'), f('imperfect'), f('future'), f('aorist'), f('perfect'), f('pluperfect'),
  ] },
  { key: 'voice', label: 'Voice', features: [
    f('active'), f('middle'), f('passive'), f('middlepassive', 'Middle/passive'),
  ] },
  { key: 'mood', label: 'Mood', features: [
    f('indicative'), f('subjunctive'), f('imperative'), f('optative'), f('infinitive'), f('participle'),
  ] },
  { key: 'person', label: 'Person', features: [
    f('1 person', '1st'), f('2 person', '2nd'), f('3 person', '3rd'),
  ] },
  { key: 'case', label: 'Case', features: [
    f('nominative'), f('genitive'), f('dative'), f('accusative'), f('vocative'),
  ] },
  { key: 'number', label: 'Number', features: [
    f('singular'), f('plural'),
  ] },
  { key: 'gender', label: 'Gender', features: [
    f('masculine'), f('feminine'), f('neuter'),
  ] },
  { key: 'degree', label: 'Degree', features: [
    f('comparative'), f('superlative'),
  ] },
]

// All valid feature tokens (for filtering a word's own parsing into selectable features).
export const ALL_MORPH_FEATURES = new Set(MORPH_GROUPS.flatMap(g => g.features.map(x => x.value)))

export const MORPH_GROUP_BY_KEY = new Map(MORPH_GROUPS.map(g => [g.key, g]))

// parsing token → the category it belongs to ('genitive' → 'case'), so a matched word's parsing
// can be read back apart. Agreement checking needs this: to know whether two words share a case,
// you have to pull each one's case out of its parsing string.
export const CATEGORY_OF_TOKEN = new Map(
  MORPH_GROUPS.flatMap(g => g.features.map(f => [f.value, g.key] as const)),
)

// The categories two words can be required to agree in. Person is deliberately absent: agreement
// in Greek is adjectival concord, and a finite verb agreeing with its subject in person is a
// different relation than the one this expresses.
export const AGREEMENT_CATEGORIES = ['case', 'number', 'gender'] as const

// value → human label, for criteria chips and dropdown buttons.
export const FEATURE_LABEL = new Map(MORPH_GROUPS.flatMap(g => g.features.map(f => [f.value, f.label] as const)))

// Which parsing categories actually apply to a given part of speech — Construct search shows
// only these, so you can't build an impossible term (a dative verb, a tensed noun). Keyed by
// the 'pos' feature value; '' (any part of speech) offers everything.
const POS_CATEGORIES: Record<string, string[]> = {
  '':            ['tense', 'voice', 'mood', 'person', 'case', 'number', 'gender', 'degree'],
  verb:          ['tense', 'voice', 'mood', 'person', 'number'],
  noun:          ['case', 'number', 'gender'],
  article:       ['case', 'number', 'gender'],
  adjective:     ['case', 'number', 'gender', 'degree'],
  pronoun:       ['person', 'case', 'number', 'gender'],
  number:        ['case', 'number', 'gender'],
  adverb:        ['degree'],
  preposition:   [],
  conjunction:   [],
  particle:      [],
  interjection:  [],
}

// Participles and infinitives are verbs that decline, so case/gender only become relevant
// once one of those moods is in play — that keeps the plain finite-verb term uncluttered.
const DECLINING_MOODS = new Set(['participle', 'infinitive'])

// The category groups to show for a term, given its selected part of speech and moods.
export function categoriesFor(pos: string, moods: string[] = []): MorphGroup[] {
  const keys = [...(POS_CATEGORIES[pos] ?? POS_CATEGORIES[''])]
  if ((pos === 'verb' || pos === '') && moods.some(m => DECLINING_MOODS.has(m))) {
    for (const k of ['case', 'gender']) if (!keys.includes(k)) keys.push(k)
  }
  return keys.map(k => MORPH_GROUP_BY_KEY.get(k)).filter((g): g is MorphGroup => !!g)
}

// The part-of-speech options (the one category that is always a single choice).
export const POS_FEATURES = MORPH_GROUP_BY_KEY.get('pos')!.features

// Split a word's parsing string ("Verb, Aorist, Active, Participle, …") into the feature
// tokens the picker understands, so right-click can pre-select the word's own morphology.
export function parsingToFeatures(parsing: string | undefined | null): string[] {
  if (!parsing) return []
  return parsing.toLowerCase().split(',').map(t => t.trim()).filter(t => ALL_MORPH_FEATURES.has(t))
}
