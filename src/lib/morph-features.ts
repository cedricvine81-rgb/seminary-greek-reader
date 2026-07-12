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

// Split a word's parsing string ("Verb, Aorist, Active, Participle, …") into the feature
// tokens the picker understands, so right-click can pre-select the word's own morphology.
export function parsingToFeatures(parsing: string | undefined | null): string[] {
  if (!parsing) return []
  return parsing.toLowerCase().split(',').map(t => t.trim()).filter(t => ALL_MORPH_FEATURES.has(t))
}
