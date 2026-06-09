import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions, generateMorphologyQuestions,
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

  const { type, count, level } = await req.json()

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { type: true, level: true, morphSubtype: true },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const qType = (type as QuestionType) ?? 'GREEK_TO_ENGLISH'
  const qCount = Math.min(Math.max(Number(count) || 10, 1), 50)
  const qLevel = (level as CourseLevel) ?? assignment.level
  const morphSubtype = assignment.morphSubtype ?? 'ALL'

  let questions: ReturnType<typeof generateVerbParseQuestions> | Awaited<ReturnType<typeof generateVocabQuestions>> = []

  if (assignment.type === 'VOCABULARY_QUIZ') {
    questions = await generateVocabQuestions(qLevel, qType, qCount)
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

  // Replace all existing questions
  await prisma.question.deleteMany({ where: { assignmentId: params.assignmentId } })

  if (questions.length > 0) {
    await prisma.question.createMany({
      data: questions.map(q => ({ ...q, assignmentId: params.assignmentId })),
    })
  }

  return NextResponse.json({ count: questions.length })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
