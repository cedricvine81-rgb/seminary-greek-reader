// End-of-practice diagnostic: what did the student actually get wrong, and where is it taught?
//
// Practice is FORMATIVE — nothing here is written to the progress store or to a grade. The
// transcript lives for the length of the session; this module only turns it into a report.
//
// The useful property is that the report's output IS a parse filter: "you missed aorist
// passives" is { tenses: ['Aorist'], voices: ['Passive'] }, which is exactly what
// generateMorphQuestionsFromConfig already takes. So "what needs practising" and "drill that"
// are the same object, and the [Drill these] button is a regeneration, not new machinery.

/** One graded question: the form shown, the right parse, and what the student picked. */
export interface PracticeAnswer {
  prompt: string
  correct: Record<string, string | null>
  given: Record<string, string | undefined>
}

export interface FieldScore { field: string; right: number; asked: number }
/** A value the student got wrong, e.g. field 'tense', value 'Aorist', missed 5 of 7. */
export interface ValueMiss { field: string; value: string; missed: number; asked: number }

export interface PracticeReport {
  /** Per parse field: how many they got right out of how many were asked. */
  fields: FieldScore[]
  /** Per field VALUE, worst first — the actionable half of the report. */
  misses: ValueMiss[]
  /** Total graded fields, for the headline score. */
  right: number
  asked: number
}

/** Which parse fields carry a value worth reporting on (skips nulls — never asked). */
function askedFields(a: PracticeAnswer): string[] {
  return Object.keys(a.correct).filter(f => a.correct[f] != null && f !== 'partOfSpeech')
}

export function summarisePractice(answers: PracticeAnswer[]): PracticeReport {
  const fields = new Map<string, FieldScore>()
  const values = new Map<string, ValueMiss>()
  for (const a of answers) {
    for (const f of askedFields(a)) {
      const expected = a.correct[f] as string
      const ok = a.given[f] === expected
      const fs = fields.get(f) ?? { field: f, right: 0, asked: 0 }
      fs.asked++
      if (ok) fs.right++
      fields.set(f, fs)
      const vk = f + ' ' + expected
      const vm = values.get(vk) ?? { field: f, value: expected, missed: 0, asked: 0 }
      vm.asked++
      if (!ok) vm.missed++
      values.set(vk, vm)
    }
  }
  // Array.from, not a spread: the build target rejects Map-iterator spreads.
  const misses = Array.from(values.values())
    .filter(v => v.missed > 0)
    // Worst first: most missed, then worst ratio, then alphabetical so the order is stable.
    .sort((a, b) => b.missed - a.missed
      || (b.missed / b.asked) - (a.missed / a.asked)
      || a.value.localeCompare(b.value))
  const right = Array.from(fields.values()).reduce((n, f) => n + f.right, 0)
  const asked = Array.from(fields.values()).reduce((n, f) => n + f.asked, 0)
  return { fields: Array.from(fields.values()), misses, right, asked }
}

/**
 * Parse field to the filter key that whitelists its values — both languages. Person, number
 * and gender are spelled the same in MorphParseFilter and HebrewMorphParseFilter, which is why
 * one map serves: the remaining keys simply never occur in the other language's report.
 */
const FILTER_KEY: Record<string, string> = {
  tense: 'tenses', voice: 'voices', mood: 'moods', person: 'persons',
  number: 'numbers', casus: 'cases', gender: 'genders', pronounType: 'pronounTypes',
  stem: 'stems', conjugation: 'conjugations', state: 'states', type: 'types',
}

/**
 * Build the "drill these" filter from the misses.
 *
 * `depth` is how many of the ranked misses to include. A filter built from every miss at once
 * is usually far too narrow to fill a quiz — the pool is 3,932 Greek forms, and a signature
 * like aorist + passive + participle + feminine + genitive + plural may match three of them.
 * So the caller widens progressively: ask for depth 3, count the forms, and if there are too
 * few, retry at depth 2, then 1. Values for the SAME field are OR-ed (they widen the pool);
 * different fields are AND-ed (they narrow it), which is how MorphParseFilter already reads.
 */
export function drillFilter(misses: ValueMiss[], depth = 2): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const m of misses.slice(0, Math.max(1, depth))) {
    const key = FILTER_KEY[m.field]
    if (!key) continue
    const list = out[key] ?? []
    if (!list.includes(m.value)) list.push(m.value)
    out[key] = list
  }
  return out
}
