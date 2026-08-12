// Font and text-direction for a piece of quiz text, chosen from the text itself.
//
// Shared by the student quiz runner and the instructor's Sample Quiz preview so the two
// cannot drift: what the instructor previews is set exactly as the student will see it.
// Detection is by script rather than by course level because one string may mix them —
// a Hebrew form with an English gloss, a Greek lemma in an English sentence.

/** True if the string contains any Greek characters. */
export function hasGreek(s: string | undefined | null): boolean {
  return /[Ͱ-Ͽἀ-῿]/.test(s ?? '')
}

/** True if the string contains any Hebrew characters. */
export function hasHebrew(s: string | undefined | null): boolean {
  return /[֐-׿יִ-ﭏ]/.test(s ?? '')
}

/**
 * Font + direction props to spread onto the element rendering `s`.
 *
 * Hebrew needs dir="rtl" — without it the pointing renders in the wrong order — but ONLY
 * when the text is Hebrew throughout. A morphology prompt carries the form AND an English
 * lexeme/gloss — "עָשָׂה  (עָשָׂה — to do)" — and forcing the whole line right-to-left would
 * throw the English parenthetical to the wrong end. Left as LTR, Unicode bidi lays the
 * Hebrew run out correctly on its own.
 */
export function scriptProps(s: string | undefined | null): { className: string; dir?: 'rtl' } {
  if (hasHebrew(s)) {
    const mixed = /[A-Za-z]/.test(s ?? '')
    return { className: 'font-hebrew', dir: mixed ? undefined : 'rtl' }
  }
  if (hasGreek(s)) return { className: 'font-greek' }
  return { className: '' }
}
