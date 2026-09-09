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

/** A parse as any of the surfaces holds one. Fields a form does not carry are null in the
 *  generators' answer keys and absent in a student's draft, so both are allowed here. */
export type MorphParse = Record<string, string | null | undefined>

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

// ── Systematic syncretism ─────────────────────────────────────────────────────
//
// The table above is EVIDENCE: pairs of readings the corpus actually happens to hold for one
// form. That misses the cases where Greek spelling makes two parses indistinguishable as a
// matter of grammar rather than of what a verse happened to contain — πνεῦμα in 1 Cor 12:8 is
// tagged accusative, and a student who parsed it nominative was marked wrong for saying
// something no Greek form could contradict.
//
// Two rules cover it, and only two, because only these two hold for EVERY declension:
//
//   1. A neuter is spelled alike in the nominative, accusative and vocative, in both numbers
//      (πνεῦμα, πνεύματα).
//   2. In the plural the vocative is the nominative, in every gender (ἄνθρωποι, ἀδελφαί).
//
// Deliberately NOT included: the singular vocative outside the neuter. It is a real, distinct
// form in the second declension (λόγε, not λόγος) and often in the third (γύναι, πάτερ), so
// accepting it would mark a genuine error right.
//
// Applied as a rule at checking time rather than baked into the table, so it covers every form
// in the pool — including the ones the corpus only ever attests in one case.

/** Cases a form of this parse cannot distinguish itself from. */
function equivalentCases(parse: MorphParse): string[] {
  const casus = parse.casus
  if (!casus) return []
  const neuter = parse.gender === 'Neuter'
  const plural = parse.number === 'Plural'
  if (neuter && ['Nominative', 'Accusative', 'Vocative'].includes(casus)) {
    return ['Nominative', 'Accusative', 'Vocative']
  }
  if (plural && ['Nominative', 'Vocative'].includes(casus)) {
    return ['Nominative', 'Vocative']
  }
  return []
}

const parseKey = (p: MorphParse) =>
  Object.keys(p).sort().map(k => `${k}=${p[k] ?? ''}`).join('|')

/**
 * Every parse a student may give for this form and be right: the answer key, any reading the
 * corpus attests for the same form, and the case syncretisms above applied to each.
 *
 * Readings are whole parses and must be matched as wholes — mixing fields between them would
 * credit a parse no form actually has (nominative *and* feminine on a form that is nominative
 * neuter or accusative neuter, say).
 */
export function acceptableParses(prompt: string, correct: MorphParse): MorphParse[] {
  const seen = new Set<string>()
  const out: MorphParse[] = []
  for (const reading of [correct, ...alternativeParses(prompt)]) {
    // The reading's OWN case first, so a tie — a student who got the case wrong outright —
    // resolves to the answer key, and the correction shown quotes the corpus rather than an
    // equally-true alternative the student never saw.
    const equivalents = equivalentCases(reading)
    const cases = equivalents.length
      ? [reading.casus as string, ...equivalents.filter(c => c !== reading.casus)]
      : [reading.casus]
    for (const casus of cases) {
      const variant = reading.casus ? { ...reading, casus } : reading
      const key = parseKey(variant)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(variant as MorphParse)
    }
  }
  return out
}

/**
 * The reading that fits the student's answer best, and how many of `fields` it agrees on.
 *
 * One place, because the three surfaces that grade a parse — the server's grader, the quiz's
 * instant feedback and the practice runs — have to agree. They did not: the server already
 * accepted alternative readings while both clients compared against the answer key alone, so a
 * student saw a red cross on an answer the mark then counted as right.
 */
export function bestReading(
  readings: MorphParse[],
  student: MorphParse,
  fields: string[],
): { reading: MorphParse; matches: number } {
  let best = { reading: readings[0] ?? {}, matches: -1 }
  for (const reading of readings) {
    const matches = fields.filter(f =>
      (student[f] ?? '').toLowerCase() === (reading[f] ?? '').toLowerCase()).length
    if (matches > best.matches) best = { reading, matches }
  }
  return best
}
