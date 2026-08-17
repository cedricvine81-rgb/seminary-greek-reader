// Repair the "Weekly vocab quiz" series: give each week its Glanz band, as the weekly
// schedule intended, instead of the one flat 17-section pool the stale form selection caused.
import { prisma } from '@/lib/db'
import { generateHebrewVocabPoolFromSelection } from '@/lib/quiz-generation'
import { HEBREW_DECK } from '@/lib/vocab-decks'

async function main() {
  const APPLY = process.argv.includes('--apply')
  const bands = (HEBREW_DECK.bands ?? []).map(b => b.key)
  const c = await prisma.course.findFirst({ where: { name: { contains: 'Hebrew FA2026' } }, select: { id: true } })
  const qs = await prisma.assignment.findMany({
    where: { courseId: c!.id, type: 'VOCABULARY_QUIZ', title: { contains: 'Weekly vocab quiz' } },
    orderBy: { weekNumber: 'asc' },
    select: { id: true, title: true, weekNumber: true, vocabFillPct: true, vocabReviewPct: true,
              provideDefinition: true, _count: { select: { responses: true, attempts: true } } } })
  const touched = qs.filter(q => q._count.responses > 0 || q._count.attempts > 0)
  if (touched.length) throw new Error(`refusing: ${touched.length} have student work`)
  for (const q of qs) {
    const wk = q.weekNumber
    const review = wk > bands.length
    const subsections = review ? bands : [bands[Math.max(1, wk) - 1]]
    const reviewPct = review || wk <= 1 ? 0 : (q.vocabReviewPct ?? 20)
    const fill = q.vocabFillPct ?? (q.provideDefinition ? 100 : 0)
    const pool = generateHebrewVocabPoolFromSelection(subsections, [], 'HEBREW_TO_ENGLISH', fill, reviewPct)
    const label = review ? 'Glanz review' : subsections[0]
    const title = q.title.replace(/\s*\((Glanz[^)]*|§[^)]*)\)\s*$/, '') + ` (${label})`
    console.log(`${APPLY ? 'FIX' : 'dry'} wk${String(wk).padEnd(2)} ${title.padEnd(46)} pool=${pool.length} review=${reviewPct}%`)
    if (!APPLY) continue
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: q.id } }),
      prisma.question.createMany({ data: pool.map(p => ({ ...p, assignmentId: q.id })) }),
      prisma.assignment.update({ where: { id: q.id }, data: { title,
        vocabSelection: { subsections, pos: [], perAttempt: 20, reviewPct } } }),
    ])
  }
  console.log(APPLY ? 'done' : 'dry run — rerun with --apply')
  await prisma.$disconnect()
}
main()
