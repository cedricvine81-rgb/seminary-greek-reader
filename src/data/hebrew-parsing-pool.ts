// Typed access to the generated HEBREW morphology-quiz pool.
//
// Real MT forms pulled from the OSHB-tagged corpus by scripts/build-hebrew-parsing-pool.py
// and normalised into the same traditional vocabulary the Reader's parsing pane uses. See
// that script for what is included and why (clitics, Aramaic, the waw-consecutive).
//
// SERVER-ONLY: this module pulls in the pool JSON, so it must not be imported from a client
// component. The instructor UI takes its field constants from '@/lib/quiz-fields-hebrew',
// which has no data dependency.
import pool from './hebrew-parsing-pool.json'

/**
 * One parsable Hebrew form. Which fields are present depends on the part of speech, and —
 * for verbs — on the conjugation: participles and infinitives have no person, infinitives
 * have no agreement at all. The generator only tests fields a form actually carries.
 */
export interface HebrewParseEntry {
  surface: string        // the inflected form shown to the student
  lexeme: string         // dictionary form
  gloss: string          // English meaning of the lexeme
  reference: string      // e.g. "Genesis 1:1"
  partOfSpeech: 'Verb' | 'Noun' | 'Adjective' | 'Pronoun'
  // Verb
  stem?: string          // binyan: Qal, Niphal, Piel, Pual, Hiphil, Hophal, Hithpael…
  conjugation?: string   // Perfect, Imperfect, Sequential imperfect, Imperative, …
  person?: string        // 1st / 2nd / 3rd — absent on participles and infinitives
  // Verbs only. 'Strong' (the regular verb a first-year course drills) or the weakness a
  // grammar files the root under — I-nun, Hollow, III-he… See HEBREW_ROOT_CLASSES.
  // NOT a tested field: it filters which forms a quiz draws, it is never the answer.
  rootClass?: string
  // Noun / Adjective / participle
  state?: string         // Absolute / Construct / Determined
  // Shared
  gender?: string
  number?: string
  // Pronoun only
  type?: string          // Personal, Demonstrative, Relative, Interrogative, Indefinite
}

export const HEBREW_VERB_POOL      = pool.verb      as HebrewParseEntry[]
export const HEBREW_NOUN_POOL      = pool.noun      as HebrewParseEntry[]
export const HEBREW_ADJECTIVE_POOL = pool.adjective as HebrewParseEntry[]
export const HEBREW_PRONOUN_POOL   = pool.pronoun   as HebrewParseEntry[]
