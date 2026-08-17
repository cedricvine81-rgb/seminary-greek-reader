import { prisma } from '@/lib/db'
import { generateHebrewMorphologyQuestions, resolveHebrewVocabCap } from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'

async function main() {
  const APPLY = process.argv.includes('--apply')
  const rows = await prisma.assignment.findMany({ where: { type: 'MORPHOLOGY_QUIZ' },
    select: { id: true, title: true, weekNumber: true, courseId: true, dueDate: true,
              morphSubtype: true, morphConfig: true,
              _count: { select: { responses: true, attempts: true, questions: true } },
              questions: { select: { correctAnswer: true } } } })
  for (const r of rows) {
    if (!r.questions.some(q => (q.correctAnswer ?? '').includes('Both'))) continue
    if (r._count.responses || r._count.attempts) { console.log(`SKIP (has student work): ${r.title}`); continue }
    const cfg = (r.morphConfig ?? null) as { fields?: string[]; parseFilter?: HebrewMorphParseFilter; vocabThruBand?: string | null } | null
    const cap = await resolveHebrewVocabCap(r.courseId, r.dueDate, r.weekNumber, cfg?.vocabThruBand ?? null)
    const qs = generateHebrewMorphologyQuestions(
      (r.morphSubtype as HebrewMorphologySubtype) ?? 'NOUN_PARSING',
      r._count.questions || 20, cfg?.fields, cfg?.parseFilter, cap)
    const stillBad = qs.filter(q => q.correctAnswer.includes('Both')).length
    console.log(`${APPLY ? 'FIX ' : 'dry '} ${r.title.slice(0,44).padEnd(44)} regenerated ${qs.length} questions, "Both" remaining: ${stillBad}`)
    if (!APPLY) continue
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: r.id } }),
      prisma.question.createMany({ data: qs.map(q => ({ ...q, assignmentId: r.id })) }),
    ])
  }
  await prisma.$disconnect()
}
main()
