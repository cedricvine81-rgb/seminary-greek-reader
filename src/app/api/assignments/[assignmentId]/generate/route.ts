import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions, generateVocabPoolFromSelection, generateMorphologyQuestions,
  generateVerbParseQuestions, generateNounParseQuestions,
  generateAdjectiveParseQuestions, generatePronounParseQuestions,
  generateConditionalQuestions, generateSubjunctiveQuestions,
} from '@/lib/quiz-generation'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import type { QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

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

  const { type, count, level, quizStylePct, vocabSubsections, vocabPos } = await req.json()

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { type: true, level: true, morphSubtype: true, provideDefinition: true, vocabSelection: true },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const qType = (type as QuestionType) ?? 'GREEK_TO_ENGLISH'
  const qCount = Math.min(Math.max(Number(count) || 10, 1), 50)  // per-attempt count

  // Effective word selection: a fresh one from the request wins; otherwise reuse
  // whatever was stored on the assignment. perAttempt = how many the player shows
  // each attempt (the quiz stores the whole pool and re-samples on retake).
  const reqSel = Array.isArray(vocabSubsections) || Array.isArray(vocabPos)
    ? { subsections: Array.isArray(vocabSubsections) ? vocabSubsections : [], pos: Array.isArray(vocabPos) ? vocabPos : [], perAttempt: qCount }
    : null
  const storedSel = (assignment.vocabSelection ?? null) as { subsections: string[]; pos: string[]; perAttempt?: number } | null
  const effectiveSel = reqSel ?? storedSel
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
    questions = effectiveSel
      ? generateVocabPoolFromSelection(effectiveSel.subsections, effectiveSel.pos, qType, provideDefinitionPct)
      : await generateVocabQuestions(qLevel, qType, qCount, provideDefinitionPct)
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

  // For pooled (re-sampling) vocab quizzes, report the per-attempt count for the UI
  // message, plus the pool size. Otherwise count is just the generated total.
  const perAttempt = effectiveSel ? Math.min(qCount, questions.length) : questions.length
  return NextResponse.json({ count: perAttempt, poolSize: questions.length, pooled: !!effectiveSel })

  } catch (err) {
    logError('api/assignments/[assignmentId]/generate', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
