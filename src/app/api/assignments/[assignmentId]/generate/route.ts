import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions, generateVocabPoolFromSelection, generateMorphologyQuestions,
  generateHebrewVocabPoolFromSelection, generateHebrewVocabQuestionsFromSelection,
  generateHebrewMorphologyQuestions,
  generateVerbParseQuestions, generateNounParseQuestions,
  generateAdjectiveParseQuestions, generatePronounParseQuestions,
  generateConditionalQuestions, generateSubjunctiveQuestions,
  resolveHebrewVocabCap,
} from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'
import { isHebrewLevel } from '@/lib/constants'
import { realignCourseMorphologyCaps } from '@/lib/morph-cap-realign'
import { glossResolver } from '@/lib/vocab-gloss-server'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import type { QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

// Regenerating a pooled quiz can write over a thousand question rows.
export const maxDuration = 120

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { type, count, level, quizStylePct, vocabSubsections, vocabPos, vocabReviewPct, force } = await req.json()

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { type: true, level: true, morphSubtype: true, morphConfig: true, provideDefinition: true,
             weekNumber: true, courseId: true, dueDate: true,
             vocabSelection: true, course: { select: { language: true } },
             _count: { select: { responses: true, attempts: true } } },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Regenerating over student work destroys it, so it needs saying yes twice ──
  // This route replaces the question rows. Response.questionId is optional with no
  // referential action, so deleting a question SETS THE STUDENT'S ANSWER'S LINK TO NULL,
  // and every grading query filters on `questionId: { not: null }`. The result is silent
  // and asymmetric: the instructor's gradebook keeps reading QuizAttempt.percentage and
  // still shows 87%, while the student's own scores page counts the quiz as never taken.
  // Pending appeals on those questions are cascade-deleted outright.
  //
  // Measured on a 30-student quiz: one click detached all 300 responses, HTTP 200, no
  // warning. So the server now refuses unless the caller has seen the numbers and passed
  // `force` — the clients turn this 409 into a confirm dialog quoting the counts.
  const touched = assignment._count.responses + assignment._count.attempts
  if (touched > 0 && !force) {
    return NextResponse.json({
      error: 'studentWorkExists',
      responses: assignment._count.responses,
      attempts: assignment._count.attempts,
    }, { status: 409 })
  }

  // The assignment's own level decides the language: regeneration must not flip a Hebrew
  // quiz into Greek just because the Greek question type is the historical default.
  const hebrew = isHebrewLevel(String(level ?? assignment.level))
  const qType = (type as QuestionType) ?? (hebrew ? 'HEBREW_TO_ENGLISH' : 'GREEK_TO_ENGLISH')
  const qCount = Math.min(Math.max(Number(count) || 10, 1), 50)  // per-attempt count

  // Effective word selection: a fresh one from the request wins; otherwise reuse
  // whatever was stored on the assignment. perAttempt = how many the player shows
  // each attempt (the quiz stores the whole pool and re-samples on retake).
  const storedSel = (assignment.vocabSelection ?? null) as { subsections: string[]; pos: string[]; perAttempt?: number; reviewPct?: number } | null
  // An EMPTY selection is "the instructor chose nothing", not "choose everything". The
  // builder always sends the arrays, so treating a present-but-empty one as a selection
  // handed the generators an empty filter — which means "no filter" — and built a quiz
  // from the entire deck: 1,120 questions when 20 were asked for (measured). Requiring
  // some actual content here routes the empty case to the counted generators below.
  const reqSel = (Array.isArray(vocabSubsections) && vocabSubsections.length > 0)
                 || (Array.isArray(vocabPos) && vocabPos.length > 0)
    ? {
        subsections: Array.isArray(vocabSubsections) ? vocabSubsections : [],
        pos: Array.isArray(vocabPos) ? vocabPos : [],
        perAttempt: qCount,
        // Keep the stored review mix unless the caller explicitly sends a new one.
        reviewPct: Math.min(Math.max(Number(vocabReviewPct ?? storedSel?.reviewPct ?? 0), 0), 100),
      }
    : null
  // A STORED selection can be empty too — that is exactly how the over-sized quizzes were
  // created — so it gets the same "must actually select something" test.
  const hasWords = (s: { subsections?: string[]; pos?: string[] } | null) =>
    !!s && ((s.subsections?.length ?? 0) > 0 || (s.pos?.length ?? 0) > 0)
  const effectiveSel = reqSel ?? (hasWords(storedSel) ? storedSel : null)
  const qLevel = (level as CourseLevel) ?? assignment.level
  const morphSubtype = assignment.morphSubtype ?? 'ALL'
  // Type-of-Quiz mix: when the caller supplies a continuous quizStylePct (0–100,
  // the % of open-ended / "provide definition" questions), honour it for a real
  // mix. Otherwise fall back to the stored binary provideDefinition.
  const provideDefinitionPct = quizStylePct != null
    ? Math.min(Math.max(Number(quizStylePct), 0), 100)
    : assignment.provideDefinition ? 100 : 0

  let questions: ReturnType<typeof generateVerbParseQuestions> | Awaited<ReturnType<typeof generateVocabQuestions>> = []

  if (assignment.type === 'VOCABULARY_QUIZ') {
    // Regeneration uses the COURSE's language, so a regenerated quiz matches the one the section
    // already sat rather than flipping language under them.
    const resolve = glossResolver(assignment.course?.language ?? 'en')
    const glossOf = (w: { word: string; gloss: string }) => resolve(w.word, w.gloss)
    questions = hebrew
      // With a selection, store the whole selected pool (the player re-samples per attempt).
      // WITHOUT one, draw a counted quiz rather than the entire deck — the Greek fallback
      // below reads the VocabularyItem table, which holds no Hebrew.
      ? effectiveSel
        ? generateHebrewVocabPoolFromSelection(
            effectiveSel.subsections, effectiveSel.pos, qType,
            provideDefinitionPct, effectiveSel.reviewPct ?? 0, glossOf)
        : generateHebrewVocabQuestionsFromSelection([], [], qType, qCount, provideDefinitionPct, glossOf)
      : effectiveSel
        ? generateVocabPoolFromSelection(effectiveSel.subsections, effectiveSel.pos, qType, provideDefinitionPct, effectiveSel.reviewPct ?? 0, glossOf)
        : await generateVocabQuestions(qLevel, qType, qCount, provideDefinitionPct, assignment.course?.language ?? 'en')
  } else if (assignment.type === 'MORPHOLOGY_QUIZ' && hebrew) {
    // Rebuild from the stored recipe so a regenerated Hebrew quiz tests the same fields
    // and parse values the instructor originally configured.
    const cfg = (assignment.morphConfig ?? null) as
      { fields?: string[]; parseFilter?: HebrewMorphParseFilter; vocabThruBand?: string | null } | null
    questions = generateHebrewMorphologyQuestions(
      (assignment.morphSubtype as HebrewMorphologySubtype) ?? 'VERB_PARSING',
      qCount, cfg?.fields, cfg?.parseFilter,
      await resolveHebrewVocabCap(assignment.courseId, assignment.dueDate, assignment.weekNumber, cfg?.vocabThruBand ?? null))
  } else if (assignment.type === 'MORPHOLOGY_QUIZ') {
    switch (morphSubtype) {
      case 'VERB':        questions = generateVerbParseQuestions(qCount);       break
      case 'NOUN':        questions = generateNounParseQuestions(qCount);       break
      case 'ADJECTIVE':   questions = generateAdjectiveParseQuestions(qCount);  break
      case 'PRONOUN':     questions = generatePronounParseQuestions(qCount);    break
      case 'CONDITIONAL': questions = generateConditionalQuestions(qCount);     break
      case 'SUBJUNCTIVE': questions = generateSubjunctiveQuestions(qCount);     break
      default:            questions = await generateMorphologyQuestions(qCount); break
    }
  }

  // Replace all existing questions atomically — if createMany fails, deleteMany is rolled back.
  // For vocab quizzes also align provideDefinition with the mix (any open-ended portion →
  // typed answers are graded with fuzzy matching; 100% multiple-choice → off) when an
  // explicit quizStylePct was supplied.
  await prisma.$transaction(async tx => {
    await tx.question.deleteMany({ where: { assignmentId: params.assignmentId } })
    if (questions.length > 0) {
      await tx.question.createMany({
        data: questions.map(q => ({ ...q, assignmentId: params.assignmentId })),
      })
    }
    if (assignment.type === 'VOCABULARY_QUIZ' && (quizStylePct != null || reqSel)) {
      await tx.assignment.update({
        where: { id: params.assignmentId },
        data: {
          ...(quizStylePct != null && { provideDefinition: provideDefinitionPct > 0 }),
          ...(reqSel && { vocabSelection: reqSel }),
        },
      })
    }
  })

  // A vocab quiz regenerated with a NEW section selection changes what "taught by then"
  // means for the course's schedule-following morphology caps — re-align them (quizzes
  // whose coverage didn't change are skipped, so resending the same sections is free).
  if (assignment.type === 'VOCABULARY_QUIZ' && reqSel) {
    await realignCourseMorphologyCaps(assignment.courseId, logError, [params.assignmentId])
  }

  // For pooled (re-sampling) vocab quizzes, report the per-attempt count for the UI
  // message, plus the pool size. Otherwise count is just the generated total.
  const perAttempt = effectiveSel ? Math.min(qCount, questions.length) : questions.length
  return NextResponse.json({ count: perAttempt, poolSize: questions.length, pooled: !!effectiveSel })

  } catch (err) {
    logError('api/assignments/[assignmentId]/generate', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
