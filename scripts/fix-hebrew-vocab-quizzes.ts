// One-off repair (APPLIED to Beginning Hebrew FA2026 on 2026-08-17): give the Beginning Hebrew FA2026 vocabulary quizzes the weekly
// progression they were meant to have. Before: all 32 quizzes drew a random 20 from the
// same fixed pool (~ranks 1-320), so week 1 could ask week-12 words. After, mirroring the
// Greek course's pattern in Glanz terms:
//   weeks 1-12 : that week's Glanz band (20 words) + 20% review from earlier bands
//                (week 1: no earlier bands), 20 questions per attempt
//   weeks 13-16: cumulative review across all 12 bands, 20 sampled per attempt
import { prisma } from '@/lib/db'
import { generateHebrewVocabPoolFromSelection } from '@/lib/quiz-generation'
import { HEBREW_DECK } from '@/lib/vocab-decks'

async function main() {
const APPLY = process.argv.includes('--apply')
const bands = (HEBREW_DECK.bands ?? []).map(b => b.key)

const course = await prisma.course.findFirst({
  where: { name: { contains: 'Hebrew FA2026' } }, select: { id: true, name: true, language: true } })
if (!course) throw new Error('course not found')
const quizzes = await prisma.assignment.findMany({
  where: { courseId: course.id, type: 'VOCABULARY_QUIZ' },
  orderBy: { dueDate: 'asc' },
  select: { id: true, title: true, weekNumber: true, vocabFillPct: true, provideDefinition: true,
            _count: { select: { responses: true, attempts: true } } },
})
const touched = quizzes.filter(q => q._count.responses > 0 || q._count.attempts > 0)
if (touched.length > 0) throw new Error(`refusing: ${touched.length} quizzes already have student work`)

for (const q of quizzes) {
  const wk = q.weekNumber
  const review = wk > bands.length
  const subsections = review ? bands : [bands[Math.max(1, wk) - 1]]
  const reviewPct = review || wk <= 1 ? 0 : 20
  const fill = q.vocabFillPct ?? (q.provideDefinition ? 100 : 0)
  const pool = generateHebrewVocabPoolFromSelection(subsections, [], 'HEBREW_TO_ENGLISH', fill, reviewPct)
  const label = review ? 'Glanz review' : subsections[0]
  const title = q.title.replace(/\s*\((Glanz[^)]*|§[^)]*)\)\s*$/, '') + ` (${label})`
  console.log(`${APPLY ? 'FIX' : 'dry'} wk${String(wk).padEnd(2)} ${title.padEnd(44)} pool=${pool.length} reviewPct=${reviewPct}`)
  if (!APPLY) continue
  await prisma.$transaction([
    prisma.question.deleteMany({ where: { assignmentId: q.id } }),
    prisma.question.createMany({ data: pool.map(p => ({ ...p, assignmentId: q.id })) }),
    prisma.assignment.update({ where: { id: q.id }, data: {
      title,
      vocabSelection: { subsections, pos: [], perAttempt: 20, reviewPct },
    }}),
  ])
}
console.log(APPLY ? 'done' : 'dry run — rerun with --apply')
await prisma.$disconnect()
}
main()

// Run:  DATABASE_URL=... DIRECT_URL=... npx tsx --tsconfig tsconfig.i18n.json scripts/fix-hebrew-vocab-quizzes.ts [--apply]
//
// ROOT CAUSE, still open in the builder: the semester builder has no weekly progression for
// HEBREW vocab quizzes — it stamps the instructor'''s one selection onto every week (Greek
// has the week-to-lesson map). Rebuilding a Hebrew semester from scratch will reproduce the
// flat pool until the builder gets a week-to-band map like the one this script applies.
