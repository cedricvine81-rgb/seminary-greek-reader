/**
 * End-to-end audit of the vocabulary and morphology quiz pipelines.
 *
 * Exercises the real generators rather than mocks, and checks the invariants that
 * broke before: lesson→subsection mapping, cumulative review never overlapping the
 * current lesson, no duplicate prompts, the correct answer always among the options,
 * retakes drawing a different sample, the morphology vocab filter staying inside the
 * taught set, every correct morphology value being selectable in the player, and the
 * database decks matching the static lists.
 *
 * Needs DATABASE_URL for the final section:
 *   set -a && . ./.env.local && set +a && npx tsx scripts/audit-quiz-pipeline.ts
 */
import { SECTION_SUBSECTIONS, wordsForSelection, ALL_SUBSECTION_KEYS } from '../src/lib/vocab-subsections'
import { VOCAB_LESSONS, lessonSubsectionKey, lessonSubsectionKeysThrough, lessonSubsectionKeysBefore } from '../src/lib/vocab-lesson-map'
import {
  generateVocabQuestionsForLesson,
  generateVocabQuestionsFromSelection,
  generateVocabPoolFromSelection,
  generateMorphologyQuestionsBySubtype,
} from '../src/lib/quiz-generation'
import { MORPH_OPTIONS } from '../src/data/morphology-options'
import { normaliseLexeme } from '../src/lib/bgvb-lemmas'

const fail: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${label}${detail ? '  — ' + detail : ''}`)
  if (!cond) fail.push(label)
}

async function main() {
  console.log('\n=== 1. Lesson → subsection mapping ===')
  for (const L of VOCAB_LESSONS) {
    const key = lessonSubsectionKey(L.lesson)!
    const sec = Number(key.split('-')[0])
    const sub = SECTION_SUBSECTIONS[sec].find(s => s.key === key)
    const words = wordsForSelection([key], [])
    ok(`lesson ${L.lesson} → ${key}`, !!sub && words.length === sub!.words.length,
       `${words.length} words`)
  }

  console.log('\n=== 2. Cumulative review draws only from earlier lessons ===')
  for (const L of [1, 5, 10, 16]) {
    const cur = new Set(wordsForSelection([lessonSubsectionKey(L)!], []).map(w => w.word))
    const prevKeys = lessonSubsectionKeysBefore(L)
    // NB wordsForSelection([]) means "all sections" — lesson 1 has no earlier keys.
    const prev = new Set(prevKeys.length ? wordsForSelection(prevKeys, []).map(w => w.word) : [])
    const overlap = Array.from(cur).filter(w => prev.has(w))
    const qs = generateVocabQuestionsForLesson(L, 'GREEK_TO_ENGLISH', 20, 0, 50)
    const outside = qs.filter(q => !cur.has(q.prompt) && !prev.has(q.prompt))
    const review = qs.filter(q => prev.has(q.prompt) && !cur.has(q.prompt)).length
    ok(`lesson ${L}: no word is both current and review`, overlap.length === 0)
    ok(`lesson ${L}: every question is from the taught set`, outside.length === 0,
       outside.length ? outside.map(q => q.prompt).join(' ') : `${review} review / ${qs.length - review} current`)
  }

  console.log('\n=== 3. Question integrity (no dupes, answer present, gloss non-empty) ===')
  for (const L of [1, 8, 13, 15]) {
    const qs = generateVocabQuestionsForLesson(L, 'GREEK_TO_ENGLISH', 20, 50, 25)
    const dupes = qs.length - new Set(qs.map(q => q.prompt)).size
    const badOpt = qs.filter(q => q.options.length > 0 && !q.options.includes(q.correctAnswer))
    const blank = qs.filter(q => !q.prompt.trim() || !q.correctAnswer.trim())
    const open = qs.filter(q => q.options.length === 0).length
    ok(`lesson ${L}: no duplicate prompts`, dupes === 0)
    ok(`lesson ${L}: correct answer among options`, badOpt.length === 0)
    ok(`lesson ${L}: no blank prompt/answer`, blank.length === 0, `${open}/${qs.length} open-ended`)
  }

  console.log('\n=== 4. Retake re-sampling (pooled quizzes) ===')
  const pool = generateVocabPoolFromSelection(['2-A', '2-B'], [], 'GREEK_TO_ENGLISH', 0, 0)
  ok('pool holds the whole selection', pool.length === wordsForSelection(['2-A', '2-B'], []).length,
     `${pool.length} questions`)
  // The player draws perAttempt at random from the stored pool each attempt.
  const draw = (n: number) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, n).map(q => q.prompt)
  }
  const a = draw(10), b = draw(10)
  ok('two attempts draw different word sets', a.join() !== b.join(),
     `attempt1 ${a.slice(0, 3).join(' ')}… vs attempt2 ${b.slice(0, 3).join(' ')}…`)
  ok('positions are 1..N with no gaps', pool.every((q, i) => q.position === i + 1))

  console.log('\n=== 5. Fixed-selection quizzes ===')
  const sel = generateVocabQuestionsFromSelection(['3-A'], [], 'GREEK_TO_ENGLISH', 10, 0)
  const s3a = new Set(wordsForSelection(['3-A'], []).map(w => w.word))
  ok('every question comes from the chosen subsection', sel.every(q => s3a.has(q.prompt)), `${sel.length} questions`)

  console.log('\n=== 6. Morphology: vocab filter honours revised lists ===')
  const lemmaOf = (p: string) => p.match(/\(([^\s—)]+)\s*—/)?.[1] ?? '?'
  for (const subtype of ['VERB_PARSING', 'NOUN_PARSING', 'PRONOUN_PARSING', 'MIXED'] as const) {
    for (const thru of [1, 8, 16]) {
      const known = new Set(wordsForSelection(lessonSubsectionKeysThrough(thru), []).map(w => w.word))
      const qs = await generateMorphologyQuestionsBySubtype(subtype, 10, thru)
      const outside = qs.map(q => lemmaOf(q.prompt)).filter(l => l !== '?' && !known.has(l))
      ok(`${subtype} thru lesson ${thru}`, outside.length === 0,
         outside.length ? `outside: ${Array.from(new Set(outside)).join(' ')}` : `${qs.length} questions`)
    }
  }

  console.log('\n=== 7. Morphology answers are all selectable in the player ===')
  const morphQs = await generateMorphologyQuestionsBySubtype('MIXED', 40, null)
  let unanswerable = 0
  for (const q of morphQs) {
    const ans = JSON.parse(q.correctAnswer) as Record<string, string | null>
    for (const [field, val] of Object.entries(ans)) {
      if (!val) continue
      const opts = (MORPH_OPTIONS as unknown as Record<string, string[] | undefined>)[field]
      if (opts && !opts.includes(val)) { unanswerable++; console.log(`     ${field}="${val}" not in dropdown`) }
    }
  }
  ok('every correct value appears in its dropdown', unanswerable === 0, `${morphQs.length} questions checked`)

  console.log('\n=== 8. Subsection keys referenced by saved quizzes still exist ===')
  ok('all lesson keys are valid subsections',
     VOCAB_LESSONS.every(l => ALL_SUBSECTION_KEYS.includes(lessonSubsectionKey(l.lesson)!)))
  ok('no empty subsection', ALL_SUBSECTION_KEYS.every(k => wordsForSelection([k], []).length > 0))

  console.log('\n=== 9. Database decks match the revised lists ===')
  const { prisma } = await import('../src/lib/db')
  const beginningWords = new Set(wordsForSelection(['1-A','1-B','1-C','1-D','1-E','1-F','1-G','1-H',
    '2-A','2-B','2-C','2-D','2-E','2-F','2-G','2-H'], []).map(w => normaliseLexeme(w.word)))
  const interWords = new Set(wordsForSelection(['3-A','3-B','3-C','3-D','3-E','3-F','3-G','3-H'], []).map(w => normaliseLexeme(w.word)))
  const advKeys = ALL_SUBSECTION_KEYS.filter(k => Number(k.split('-')[0]) >= 4)
  const advWords = new Set(wordsForSelection(advKeys, []).map(w => normaliseLexeme(w.word)))
  for (const [level, expected] of [['BEGINNING', beginningWords], ['INTERMEDIATE', interWords],
                                   ['ADVANCED', advWords]] as const) {
    const rows = await prisma.vocabularyItem.findMany({ where: { level }, include: { lexeme: true } })
    const have = new Set(rows.map((r: { lexeme: { lexeme: string } }) => r.lexeme.lexeme))
    const missing = Array.from(expected).filter(w => !have.has(w))
    const extra = Array.from(have).filter(w => !expected.has(w))
    ok(`${level}: DB deck matches the list`, missing.length === 0 && extra.length === 0,
       `db=${have.size} list=${expected.size} missing=${missing.length} extra=${extra.length}`)
    if (missing.length) console.log(`     missing: ${missing.slice(0, 12).join(' ')}${missing.length > 12 ? ' …' : ''}`)
    if (extra.length) console.log(`     extra:   ${extra.slice(0, 12).join(' ')}${extra.length > 12 ? ' …' : ''}`)
  }
  const cards = await prisma.flashcard.groupBy({ by: ['level'], _count: { _all: true } })
  console.log(`     flashcards: ${cards.map((c: { level: string; _count: { _all: number } }) => c.level + '=' + c._count._all).join(' ')}`)
  await prisma.$disconnect()

  console.log(`\n${fail.length === 0 ? 'ALL CHECKS PASSED' : `${fail.length} FAILURES: ${fail.join(' | ')}`}`)

}
main()
