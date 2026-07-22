import type { MorphOptions } from '@/types/morphology'

export const MORPH_OPTIONS: MorphOptions = {
  partOfSpeech: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Preposition', 'Conjunction', 'Particle', 'Article', 'Interjection'],
  case: ['Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative'],
  number: ['Singular', 'Plural'],
  gender: ['Masculine', 'Feminine', 'Neuter'],
  tense: ['Present', 'Imperfect', 'Future', 'Aorist', 'Perfect', 'Pluperfect'],
  // "Deponent" is a voice the corpus tags (middle/passive in form, active in meaning) and it
  // appears in the quiz pool, so it must be answerable. Optative is excluded from the pool.
  voice: ['Active', 'Middle', 'Passive', 'Middle/Passive', 'Deponent'],
  mood: ['Indicative', 'Subjunctive', 'Imperative', 'Infinitive', 'Participle'],
  person: ['1st', '2nd', '3rd'],
  participleType: [
    'Adverbial Temporal', 'Adverbial Causal', 'Adverbial Concessive',
    'Adverbial Conditional', 'Adverbial Means', 'Adverbial Manner',
    'Substantival', 'Attributive', 'Predicate',
  ],
  infinitiveType: [
    'Complementary', 'Subject', 'Direct Object', 'Indirect Discourse',
    'Substantival', 'Purpose', 'Result', 'Epexegetical',
  ],
  pronounType: [
    'Personal', 'Reflexive', 'Reciprocal', 'Demonstrative',
    'Relative', 'Interrogative', 'Indefinite', 'Possessive', 'Correlative',
  ],
  articleUsage: [
    'Generic', 'Individualizing', 'Anaphoric', 'Kataphoric',
    'Monadic', 'Par Excellence', 'Substantiver',
    'With Proper Names', 'With Abstract Nouns', 'Granville Sharp',
  ],
  prepositionFunction: [
    'Spatial', 'Temporal', 'Logical/Causal', 'Instrumental',
    'Accompanying Circumstances', 'Reference/Respect', 'Distributive',
  ],
}
