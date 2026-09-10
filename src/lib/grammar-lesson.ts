/**
 * Which grammar lesson a homework set belongs to, read off its id.
 *
 * Lives in its own module with NO imports so that both sides can use it: `homework-vocab.ts`
 * (to cap the vocabulary a set may assume) and `data/grammar-homework.ts` (to order the sets by
 * lesson). The latter cannot import homework-vocab, which imports the set array back — that
 * would be a runtime cycle, the one the grammar-homework header warns about.
 */

/**
 * `l3-…` = Lesson 3, `l34-…` = Lessons 3–4, `l58-…` = Lessons 5 and 8. A set spanning two
 * lessons is done AFTER the later one, so the later lesson is the answer — for the vocabulary
 * cap and for ordering alike.
 */
export function grammarLessonForSet(setId: string): number | null {
  const m = /^l(\d+)-/.exec(setId)
  if (!m) return null
  const digits = m[1]
  // '10' is a single lesson; any other multi-digit id is a list of single-digit lessons
  if (digits === '10') return 10
  return Math.max(...digits.split('').map(Number))
}
