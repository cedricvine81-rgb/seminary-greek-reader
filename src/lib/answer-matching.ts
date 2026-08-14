/**
 * Shared answer-matching utilities used by BOTH the server-side grader
 * (`src/lib/grading.ts`) and the client-side quiz UI (`QuizPlayer.tsx`).
 *
 * Keeping these in one place ensures the client's "correct?" feedback never
 * disagrees with the score the server actually records.
 */

/** Normalise an answer: trim, lowercase, strip terminal punctuation. */
export function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/[.,;:!?]/g, '').trim()
}

/**
 * Fold an answer written in Greek or Hebrew script down to what a student can actually
 * type: Greek loses its accents and breathings (and final sigma becomes medial), Hebrew
 * loses its points and final letter forms. No ordinary keyboard produces ὑπέρ or מֶלֶךְ —
 * marking υπερ or מלך wrong fails the student for the keyboard, not the vocabulary.
 * English text passes through unchanged (the combining-mark strip touches only marks).
 */
export function foldScript(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ͂-ͅ]/g, '')   // Greek diacritics (as combining marks)
    .normalize('NFC')
    .replace(/ς/g, 'σ')
    .replace(/[֑-ׇ]/g, '')                 // Hebrew points + cantillation
    .replace(/[ךםןףץ]/g, ch => ({ 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }[ch] as string))
}

/** Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

/**
 * English negation prefixes that flip the meaning of an adjective/noun/verb.
 * Used to guard against fuzzy-matching antonyms (e.g. "unclean" vs "clean").
 *
 * Caveat: a few false positives are possible — e.g. "inflate" starts with "in" but
 * isn't a negation of "flate". The guard only fires when stripping the prefix
 * makes the two strings equal, which avoids those benign cases.
 */
const NEGATION_PREFIXES = ['un', 'non', 'dis', 'anti', 'mis', 'in', 'im', 'il', 'ir']

/** True when one of the two answers is the other prefixed by a negation. */
export function differsByNegation(a: string, b: string): boolean {
  // Without loss of generality: try treating `a` as the prefixed one, then `b`
  for (const [prefixed, base] of [[a, b], [b, a]]) {
    if (prefixed.length <= base.length) continue
    for (const p of NEGATION_PREFIXES) {
      if (prefixed.startsWith(p) && prefixed.slice(p.length) === base) return true
    }
  }
  return false
}

/**
 * Fuzzy match: tolerate a small number of typos scaled to word length.
 * Hard-rejects antonym pairs that differ only by a negation prefix
 * (e.g. "unclean" / "clean") — Levenshtein doesn't know what words mean.
 */
export function fuzzyMatch(student: string, expected: string): boolean {
  if (student === expected) return true
  if (differsByNegation(student, expected)) return false
  const maxLen = Math.max(student.length, expected.length)
  if (maxLen === 0) return true
  const allowed = maxLen <= 3 ? 0 : maxLen <= 6 ? 1 : 2
  return levenshtein(student, expected) <= allowed
}

/**
 * Strip a leading verb-gloss marker so the natural form of a verb answer matches
 * the bare gloss: "I flee" / "to flee" → "flee" (and vice-versa). Greek verbs are
 * commonly glossed either way, so we normalise both sides before comparing.
 */
export function stripVerbMarker(s: string): string {
  return s.replace(/^(to|i)\s+/, '').trim()
}

/**
 * Split a gloss into its acceptable alternatives on commas/semicolons, IGNORING any that
 * fall inside brackets — "(with gen., dat.) from" is one alternative, not two.
 */
export function splitAlternatives(s: string): string[] {
  const out: string[] = []
  let depth = 0, buf = ''
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
    if ((ch === ',' || ch === ';') && depth === 0) { out.push(buf); buf = '' }
    else buf += ch
  }
  out.push(buf)
  return out
}

/**
 * Every form of a gloss we are willing to accept.
 *
 * Glosses carry parenthetical notes of two different kinds, and a student typing the
 * correct answer must not be marked wrong for either:
 *   • a grammatical note to skip — "(with dat.) in", "you (m.s.)" → accept "in", "you"
 *   • the substance itself      — "(direct object marker)"       → accept the inner text
 * Since we cannot tell them apart, both the outside and the inside are accepted, plus the
 * whole thing with the brackets merely removed. The cost is over-generosity on a note like
 * "with dat"; the alternative is failing אֵת and יְהֹוָה, the two commonest words in the
 * Hebrew deck, and every Greek preposition.
 */
function glossForms(alt: string): string[] {
  const outside = normalise(alt.replace(/[([][^)\]]*[)\]]/g, ' '))   // "you (m.s.)" → "you"
  const inside  = Array.from(alt.matchAll(/[([]([^)\]]*)[)\]]/g)).map(m => normalise(m[1]))
  const flat    = normalise(alt.replace(/[()[\]]/g, ' '))            // brackets dropped, text kept
  return [normalise(alt), outside, flat, ...inside].filter(Boolean)
}

/**
 * Returns true if `studentAnswer` matches `correctAnswer`.
 * `correctAnswer` may contain comma-separated acceptable alternatives.
 * When `fuzzy` is true, small typos are tolerated (used in "provide definition" mode).
 */
export function isAnswerCorrect(studentAnswer: string, correctAnswer: string, fuzzy = false): boolean {
  const student = normalise(studentAnswer)
  if (!student) return false
  // Compare both the raw answer and a verb-marker-stripped form, so "I flee" / "to flee"
  // match a "flee" gloss (and the reverse).
  const studentForms = Array.from(new Set([student, stripVerbMarker(student)])).filter(Boolean)
  // Accept either commas OR semicolons as separators between acceptable alternatives.
  // Lexicon glosses use both conventions (e.g. "love, affection" vs "I raise; I rise").
  // The WHOLE gloss is an alternative too: a student who writes out the complete
  // definition as printed ("gift, offering, tribute") has plainly earned the mark, but
  // matched only against the parts they were being marked wrong.
  const alts = [...splitAlternatives(correctAnswer), correctAnswer].flatMap(glossForms)
  const altForms = Array.from(new Set(alts.flatMap(a => [a, stripVerbMarker(a)]))).filter(Boolean)
  if (fuzzy ? studentForms.some(s => altForms.some(alt => fuzzyMatch(s, alt)))
            : studentForms.some(s => altForms.includes(s))) {
    return true
  }
  // Script-folded second chance for answers WRITTEN IN Greek or Hebrew (English→Greek /
  // English→Hebrew): accents, breathings and points are not typeable on an ordinary
  // keyboard, so υπερ must match ὑπέρ and מלך must match מֶלֶךְ. Folding changes nothing
  // for English answers, so this costs plain glosses no strictness.
  const foldedAlts = altForms.map(foldScript)
  return studentForms.map(foldScript).some(s => s && foldedAlts.includes(s))
}

/**
 * Match for MULTIPLE-CHOICE questions: the student picked a whole option, so it must
 * equal the full correct answer as-is. We must NOT split on commas here, because a
 * single gloss can itself contain a comma (e.g. "hope, expectation") — that's one
 * option, not two alternatives.
 */
export function isMultipleChoiceCorrect(studentAnswer: string, correctAnswer: string): boolean {
  return normalise(studentAnswer) === normalise(correctAnswer)
}
