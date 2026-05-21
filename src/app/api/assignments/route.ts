import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { generateVocabQuestions, generateMorphologyQuestions } from '@/lib/quiz-generation'
import type { AssignmentType, QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const courseId = searchParams.get('courseId')

  const assignments = await prisma.assignment.findMany({
    where: courseId ? { courseId } : { course: { enrollments: { some: { userId: payload.sub } } } },
    include: { _count: { select: { questions: true } } },
    orderBy: [{ weekNumber: 'asc' }, { dueDate: 'asc' }],
  })
  return NextResponse.json({ assignments })
}

export async function POST(req: NextRequest) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { courseId, title, type, weekNumber, dueDate, level, reference, instructions, numQuestions, timePerQuestion } = body

  const assignment = await prisma.assignment.create({
    data: {
      courseId, title,
      type: type as AssignmentType,
      weekNumber: Number(weekNumber),
      dueDate: new Date(dueDate),
      level: level as CourseLevel,
      reference, instructions,
      timePerQuestion: timePerQuestion ? Number(timePerQuestion) : null,
      createdById: payload.sub,
      isPublished: false,
    },
  })

  // Auto-generate questions
  let questions: Array<{
    position: number; type: QuestionType; prompt: string
    correctAnswer: string; options: string[]; points: number
  }> = []

  if (type === 'VOCABULARY_QUIZ') {
    questions = await generateVocabQuestions(level as CourseLevel, 'GREEK_TO_ENGLISH', Number(numQuestions ?? 10))
  } else if (type === 'MORPHOLOGY_QUIZ') {
    questions = await generateMorphologyQuestions(Number(numQuestions ?? 10))
  }

  if (questions.length > 0) {
    await prisma.question.createMany({
      data: questions.map(q => ({ ...q, assignmentId: assignment.id })),
    })
  }

  return NextResponse.json({ assignment }, { status: 201 })
}
