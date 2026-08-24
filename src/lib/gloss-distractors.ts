/**
 * Wrong-answer choice for multiple-choice vocabulary questions.
 *
 * Extracted from quiz-generation.ts (server-only: it pulls the parsing pools and prisma) so
 * the CLIENT-side quizzes — the self-study practice quizzes, which build their questions in
 * the browser from the deck — pick distractors by the same rules the instructor quizzes do.
 * One implementation, so the two can never drift: a question that is fair in a course quiz
 * is fair in the self-study twin.
 */
import { isAnswerCorrect } from './answer-matching'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Function words that don't carry the meaning of a gloss, so "to loose" and "to see" still count
// as distinct answers. Content words — including pronouns like "he/she/it" — DO count, so a
// distractor sharing them ("this, he, she, it" against "he, she, it; same") is rejected.
const GLOSS_STOPWORDS = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'or'])

export function glossKeywords(s: string): Set<string> {
  return new Set(
    // Parenthesised spans are grammatical notes, not meaning: "(with dat.)", "(as noun)",
    // "(mid.)". Reading them as meaning made every preposition a near-synonym of every
    // other — they all contain "with" — which emptied the clean-distractor pool and forced
    // the fallback that put ἐκ "from out, from" beside ἀπό "(with gen.) from, away from".
    // Dropping them leaves ἐν = {in} and σύν = {with}: different, as they should be.
    s.toLowerCase().replace(/\([^)]*\)/g, ' ')
      .split(/[\s,;/()[\].]+/)
      .map(t => t.replace(/[^a-z]/g, ''))
      .filter(t => t.length > 1 && !GLOSS_STOPWORDS.has(t)),
  )
}

// Pick wrong-answer options that are genuinely wrong: never the correct answer, and never a
// gloss that shares a meaning-word with it (which would make it a second right answer, e.g.
// "not, lest" beside "no, not"). If too few clean distractors exist, top up with the rest.
// (For Greek-word pools the keyword sets are empty, so this reduces to "not equal".)
/**
 * Choose `count` wrong options for a multiple-choice question.
 *
 * Three rules, in order of importance:
 *  1. **Never offer a distractor the grader would mark correct.** Two words can carry the
 *     same gloss ("understanding, insight"), and a Hebrew homograph carries two — so an
 *     unchecked distractor can be a second right answer. Checked with the real matcher,
 *     both ways round, so what is offered and what is accepted cannot disagree.
 *  2. **No repeats.** Deduped on the normalised gloss, not the raw string, or the same
 *     meaning appears twice in the list and the question looks broken.
 *  3. Prefer distractors sharing no keyword with the key, so the wrong answers are not
 *     near-synonyms; fall back to the rest of the pool, then to `fallback` (the whole
 *     deck) rather than return a short list — a two-option "multiple choice" is worse
 *     than a distant distractor.
 */
export function pickDistractors(
  correct: string, pool: string[], count = 3, fallback: string[] = [], forbidden: string[] = [],
): string[] {
  const correctKw = glossKeywords(correct)
  const shares = (s: string) => Array.from(glossKeywords(s)).some(t => correctKw.has(t))
  const seen = new Set<string>([correct.trim().toLowerCase(), ...forbidden.map(f => f.trim().toLowerCase())])
  const chosen: string[] = []

  const usable = (s: string) => {
    const norm = s.trim().toLowerCase()
    if (!norm || seen.has(norm)) return false
    // Would this "wrong" option be accepted as the answer? Then it is not wrong.
    return !isAnswerCorrect(s, correct, true) && !isAnswerCorrect(correct, s, true)
  }
  const drain = (src: string[]) => {
    for (const s of shuffle(src)) {
      if (chosen.length >= count) return
      if (!usable(s)) continue
      seen.add(s.trim().toLowerCase())
      chosen.push(s)
    }
  }

  drain(pool.filter(s => !shares(s)))   // semantically distant first
  if (chosen.length < count) drain(pool)
  if (chosen.length < count) drain(fallback)
  return chosen
}
