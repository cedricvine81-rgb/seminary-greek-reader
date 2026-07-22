// Typed access to the generated morphology-quiz pool.
//
// The pool is real NT forms pulled from the tagged GNT corpus by
// scripts/build-parsing-pool.py and normalised for the quiz (see that script for the
// normalisation rules). It replaces the small hand-curated set in greek-parsing-data.ts.
//
// SERVER-ONLY: this module pulls in ~840KB of JSON, so it must not be imported from a
// client component. The instructor UI takes its field/filter constants from
// '@/lib/quiz-fields' instead, which has no data dependency.
import pool from './greek-parsing-pool.json'
import type { GreekParseEntry } from './greek-parsing-data'

export const VERB_POOL = pool.verb as GreekParseEntry[]
export const NOUN_POOL = pool.noun as GreekParseEntry[]
export const ADJECTIVE_POOL = pool.adjective as GreekParseEntry[]
export const PRONOUN_POOL = pool.pronoun as GreekParseEntry[]
