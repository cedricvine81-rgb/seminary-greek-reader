// Switch the FA2026 "Weekly vocab quiz" series from Glanz bands to the Hebrew Vocabulary
// page's §-sections, in page order starting at §1-A. The series' first quiz is week 2 (week
// 1 holds the Gen 12:1-3 translation), so quiz i covers §-key[i]: week 2 → §1-A (the vocab
// studied in week 1), week 3 → §1-B, … week 14 → §2-D. Review share and per-attempt
// sampling are preserved from each quiz's current settings.
import { prisma } from '@/lib/db'
import { generateHebrewVocabPoolFromSelection } from '@/lib/quiz-generation'
import { HEBREW_DECK } from '@/lib/vocab-decks'

async function main() {
  const APPLY = process.argv.includes('--apply')
  const keys = HEBREW_DECK.allSubsectionKeys
  const c = await prisma.course.findFirst({ where: { name: { contains: 'Hebrew FA2026' } }, select: { id: true, name: true } })
  if (!c) throw new Error('course not found')
  const qs = await prisma.assignment.findMany({
    where: { courseId: c.id, type: 'VOCABULARY_QUIZ', title: { contains: 'Weekly vocab quiz' } },
    orderBy: { weekNumber: 'asc' },
    select: { id: true, title: true, weekNumber: true, vocabFillPct: true, vocabReviewPct: true,
              provideDefinition: true, vocabSelection: true,
              _count: { select: { responses: true, attempts: true } } } })
  console.log(`${c.name}: ${qs.length} weekly vocab quizzes`)
  const touched = qs.filter(q => q._count.responses > 0 || q._count.attempts > 0)
  if (touched.length) throw new Error(`refusing: ${touched.length} have student work`)
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i]
    const key = keys[i]
    if (!key) throw new Error(`ran out of §-keys at quiz ${i}`)
    const sel = (q.vocabSelection ?? {}) as { reviewPct?: number; perAttempt?: number }
    const reviewPct = i === 0 ? 0 : Math.min(Math.max(Number(sel.reviewPct ?? q.vocabReviewPct ?? 0), 0), 100)
    const perAttempt = Number(sel.perAttempt ?? 20) || 20
    const fill = q.vocabFillPct ?? (q.provideDefinition ? 100 : 0)
    const subsections = [key]
    const pool = generateHebrewVocabPoolFromSelection(subsections, [], 'HEBREW_TO_ENGLISH', fill, reviewPct)
    const title = q.title.replace(/\s*\((Glanz[^)]*|§[^)]*)\)\s*$/, '') + ` (§${key})`
    console.log(`${APPLY ? 'FIX' : 'dry'} wk${String(q.weekNumber).padEnd(2)} ${title.padEnd(48)} pool=${pool.length} review=${reviewPct}% perAttempt=${perAttempt}`)
    if (!APPLY) continue
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: q.id } }),
      prisma.question.createMany({ data: pool.map(p => ({ ...p, assignmentId: q.id })) }),
      prisma.assignment.update({ where: { id: q.id }, data: { title,
        vocabSelection: { subsections, pos: [], perAttempt, reviewPct } } }),
    ])
  }
  console.log(APPLY ? 'done' : 'dry run — rerun with --apply')
  await prisma.$disconnect()
}
main()
