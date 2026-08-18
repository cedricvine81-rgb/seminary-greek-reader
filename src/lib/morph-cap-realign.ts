import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import {
  generateHebrewMorphologyQuestions, generateMorphQuestionsFromConfig,
  resolveHebrewVocabCap, type MorphGenConfig,
} from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'
import type { MorphologySubtype } from '@/lib/quiz-fields'
import { isHebrewLevel } from '@/lib/constants'

/**
 * Re-align a morphology quiz's vocabulary cap after its schedule slot moved.
 *
 * A morphology quiz's questions are generated ONCE, with the vocab cap resolved from the
 * due date / week at generation time — so a quiz an instructor drags to a different week
 * keeps testing the vocabulary of its old slot. This regenerates the questions under the
 * new slot, but only when the quiz was actually FOLLOWING the schedule:
 *
 *  - Hebrew: only a `vocabThruBand: 'auto'` cap follows the course's vocab quizzes; a
 *    fixed band (or no cap — the verb-paradigm quizzes) is instructor intent, untouched.
 *  - Greek: the lesson cap follows the week under the builder's auto convention
 *    (lesson = min(week, 16)). If the stored cap matches what the OLD week implied, the
 *    quiz was on auto and the cap moves with it; a cap that differs was set by hand and
 *    stays put.
 *
 * Never touches a quiz with student work (answers must keep matching their questions),
 * and never fails the caller — the schedule edit itself must always succeed.
 */
/** Stable fingerprint of a resolved Hebrew cap, stored in morphConfig so a re-align can
    tell "the schedule moved but this quiz's coverage didn't" and leave the questions be. */
function hebrewCapSig(cap: string | Set<string> | null): string {
  if (cap == null) return 'none'
  if (typeof cap === 'string') return `band:${cap}`
  return 'set:' + createHash('sha1').update(Array.from(cap).sort().join(',')).digest('hex').slice(0, 16)
}

/**
 * Re-align every morphology quiz in a course after a VOCAB quiz's date moved — that move
 * changes what "taught by then" means for any date-resolved ('auto') cap. The per-quiz
 * coverage fingerprint keeps this cheap: quizzes whose covered vocabulary didn't actually
 * change are skipped untouched, so a whole-series shift that preserves relative order
 * regenerates nothing. Greek lesson caps don't depend on vocab-quiz dates and no-op here.
 * Best-effort per quiz — one failure neither stops the sweep nor the edit that caused it.
 */
export async function realignCourseMorphologyCaps(
  courseId: string,
  log: (scope: string, err: unknown) => void,
  excludeIds: string[] = [],
): Promise<void> {
  const morphs = await prisma.assignment.findMany({
    where: { courseId, type: 'MORPHOLOGY_QUIZ', id: { notIn: excludeIds } },
    select: { id: true, weekNumber: true },
  })
  for (const m of morphs) {
    try { await realignMorphologyVocabCap(m.id, m.weekNumber) }
    catch (err) { log('morph-cap-realign course sweep', err) }
  }
}

export async function realignMorphologyVocabCap(assignmentId: string, prevWeekNumber: number):
  Promise<{ realigned: boolean; reason?: string }> {
  const r = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true, type: true, level: true, courseId: true, dueDate: true, weekNumber: true,
      morphSubtype: true, morphConfig: true, vocabThruLesson: true,
      _count: { select: { questions: true, responses: true, attempts: true } },
    },
  })
  if (!r || r.type !== 'MORPHOLOGY_QUIZ') return { realigned: false, reason: 'not a morphology quiz' }
  if (!r.morphConfig) return { realigned: false, reason: 'no stored recipe' }
  if (r._count.responses > 0 || r._count.attempts > 0) return { realigned: false, reason: 'has student work' }

  const cfg = r.morphConfig as
    { fields?: string[]; parseFilter?: HebrewMorphParseFilter; vocabThruBand?: string | null; numQuestions?: number; capSig?: string }
  // The recipe's requested count, not the stored pool size: a vocab cap can thin the pool,
  // and reading the thinned size back would ratchet the quiz smaller on every later move.
  const count = cfg.numQuestions ?? (r._count.questions || 20)

  if (isHebrewLevel(String(r.level))) {
    if (cfg.vocabThruBand !== 'auto') return { realigned: false, reason: 'cap not on auto' }
    const cap = await resolveHebrewVocabCap(r.courseId, r.dueDate, r.weekNumber, 'auto')
    const sig = hebrewCapSig(cap)
    // Same coverage as last time → the existing questions are still right; don't churn them.
    if (cfg.capSig === sig && r._count.questions > 0) return { realigned: false, reason: 'coverage unchanged' }
    const qs = generateHebrewMorphologyQuestions(
      (r.morphSubtype as HebrewMorphologySubtype) ?? 'VERB_PARSING',
      count, cfg.fields, cfg.parseFilter, cap)
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: r.id } }),
      prisma.question.createMany({ data: qs.map(q => ({ ...q, assignmentId: r.id })) }),
      prisma.assignment.update({ where: { id: r.id },
        data: { morphConfig: JSON.parse(JSON.stringify({ ...cfg, capSig: sig })) } }),
    ])
    return { realigned: true }
  }

  // Greek
  if (r.vocabThruLesson == null) return { realigned: false, reason: 'uncapped' }
  if (r.vocabThruLesson !== Math.min(prevWeekNumber, 16)) return { realigned: false, reason: 'cap set by hand' }
  const cap = Math.min(r.weekNumber, 16)
  if (cap === r.vocabThruLesson) return { realigned: false, reason: 'cap unchanged' }
  const qs = await generateMorphQuestionsFromConfig(
    (r.morphSubtype ?? 'MIXED') as MorphologySubtype, count, cap, r.morphConfig as MorphGenConfig)
  await prisma.$transaction([
    prisma.question.deleteMany({ where: { assignmentId: r.id } }),
    prisma.question.createMany({ data: qs.map(q => ({ ...q, assignmentId: r.id })) }),
    prisma.assignment.update({ where: { id: r.id }, data: { vocabThruLesson: cap } }),
  ])
  return { realigned: true }
}
