/**
 * Greek forms that have more than one legitimate parse, so a parsing quiz can accept any of them.
 *
 * A parsing question shows a form on its own. Greek being what it is, the form often does not
 * determine its own parse: παντί is masculine AND neuter dative singular, πολλῶν is genitive
 * plural in all three genders, πάντα is nominative and accusative neuter plural. The quiz pool
 * stores each reading as a separate entry, so whichever one was drawn became "the" answer and a
 * student who gave the other was marked down for saying something entirely correct.
 *
 * 144 forms are affected — 4% of the verbs, 8% of the nouns, 10% of the adjectives and 35% of the
 * pronouns, which is why pronoun quizzes felt harshest.
 *
 * Consulted at GRADING time rather than baked into the question, so it applies to quizzes already
 * sitting in the database. Nothing has to be regenerated, and quizzes a student has part-finished
 * keep working.
 *
 * Table built by scripts/build-morph-ambiguity.mjs from the same pool the questions come from.
 */
import table from '@/data/morph-ambiguity.json'

export type MorphParse = Record<string, string | undefined>

const AMBIGUOUS = table as Record<string, MorphParse[]>

/**
 * The prompt a morphology question stores, e.g. `παντί  (πᾶς — all)`. Split back into the form
 * and its lexeme, which together key the table.
 */
export function formKeyFromPrompt(prompt: string): string | null {
  const m = prompt.match(/^(.+?)\s+\(([^\s—)]+)\s*—/)
  return m ? `${m[1].trim()}|${m[2]}` : null
}

/**
 * Every parse this form legitimately has, or an empty array when it is unambiguous (the common
 * case — the table holds only the forms where more than one reading exists).
 */
export function alternativeParses(prompt: string): MorphParse[] {
  const key = formKeyFromPrompt(prompt)
  return (key && AMBIGUOUS[key]) || []
}
