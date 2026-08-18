// Re-align the FA2026 Hebrew morphology quizzes with the new §-section vocab schedule:
// quizzes whose cap is 'auto' or a fixed Glanz band get vocabThruBand='auto' and their
// stored questions regenerated under the schedule-following cap. Uncapped quizzes
// (adjectives + the verb-paradigm series) are left alone by design — the paradigm
// vocabulary barely overlaps frequent vocab, and every prompt shows the gloss.
import { prisma } from '@/lib/db'
import { generateHebrewMorphologyQuestions, resolveHebrewVocabCap } from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'

async function main() {
  const APPLY = process.argv.includes('--apply')
  const c = await prisma.course.findFirst({ where: { name: { contains: 'Hebrew FA2026' } }, select: { id: true } })
  const rows = await prisma.assignment.findMany({
    where: { courseId: c!.id, type: 'MORPHOLOGY_QUIZ' },
    orderBy: { weekNumber: 'asc' },
    select: { id: true, title: true, weekNumber: true, courseId: true, dueDate: true,
              morphSubtype: true, morphConfig: true,
              _count: { select: { responses: true, attempts: true, questions: true } } } })
  for (const r of rows) {
    const cfg = (r.morphConfig ?? {}) as { subtype?: string; numQuestions?: number; fields?: string[]; parseFilter?: HebrewMorphParseFilter; vocabThruBand?: string | null }
    const current = cfg.vocabThruBand ?? null
    if (!current) { console.log(`keep  wk${String(r.weekNumber).padEnd(2)} ${r.title.slice(0, 55)} (uncapped by design)`); continue }
    if (r._count.responses || r._count.attempts) { console.log(`SKIP (student work): ${r.title}`); continue }
    const cap = await resolveHebrewVocabCap(r.courseId, r.dueDate, r.weekNumber, 'auto')
    const qs = generateHebrewMorphologyQuestions(
      (r.morphSubtype as HebrewMorphologySubtype) ?? 'NOUN_PARSING',
      cfg.numQuestions ?? r._count.questions ?? 20, cfg.fields, cfg.parseFilter, cap)
    console.log(`${APPLY ? 'FIX' : 'dry'}   wk${String(r.weekNumber).padEnd(2)} ${r.title.slice(0, 55).padEnd(57)} cap ${current} → auto, questions ${r._count.questions} → ${qs.length}`)
    if (!APPLY) continue
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: r.id } }),
      prisma.question.createMany({ data: qs.map(q => ({ ...q, assignmentId: r.id })) }),
      prisma.assignment.update({ where: { id: r.id }, data: { morphConfig: { ...cfg, vocabThruBand: 'auto' } } }),
    ])
  }
  console.log(APPLY ? 'done' : 'dry run — rerun with --apply')
  await prisma.$disconnect()
}
main()
