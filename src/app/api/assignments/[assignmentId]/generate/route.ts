import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { generateVocabQuestions, generateMorphologyQuestions } from '@/lib/quiz-generation'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import type { QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
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
    select: { type: true, level: true },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const qType = (type as QuestionType) ?? 'GREEK_TO_ENGLISH'
  const qCount = Math.min(Math.max(Number(count) || 10, 1), 50)
  const qLevel = (level as CourseLevel) ?? assignment.level

  let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

  if (assignment.type === 'VOCABULARY_QUIZ') {
    questions = await generateVocabQuestions(qLevel, qType, qCount)
  } else if (assignment.type === 'MORPHOLOGY_QUIZ') {
    questions = await generateMorphologyQuestions(qCount)
  }

  // Replace all existing questions
  await prisma.question.deleteMany({ where: { assignmentId: params.assignmentId } })

  if (questions.length > 0) {
    await prisma.question.createMany({
      data: questions.map(q => ({ ...q, assignmentId: params.assignmentId })),
    })
  }

  return NextResponse.json({ count: questions.length })
}
