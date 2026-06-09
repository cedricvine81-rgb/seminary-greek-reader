import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { generateVocabQuestions, generateMorphologyQuestionsBySubtype, type MorphologySubtype } from '@/lib/quiz-generation'
import type { AssignmentType, QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  try {
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

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { courseId, title, type, weekNumber, dueDate, level, reference, instructions, numQuestions, timePerQuestion, reviewTimeSeconds, allowLate, lateDaysLimit, provideDefinition, maxRetakes, isPublished, quizStylePct, morphologySubtype, vocabThruLesson } = body

  // Validate required fields
  if (!courseId || !title || !type || !weekNumber || !dueDate || !level) {
    return NextResponse.json({ error: 'courseId, title, type, weekNumber, dueDate, and level are required.' }, { status: 400 })
  }
  if (type === 'TRANSLATION_EXERCISE' && !reference?.trim()) {
    return NextResponse.json({ error: 'A passage reference is required for Translation Exercise assignments.' }, { status: 400 })
  }

  const assignment = await prisma.assignment.create({
    data: {
      courseId, title,
      type: type as AssignmentType,
      weekNumber: Number(weekNumber),
      dueDate: new Date(dueDate),
      level: level as CourseLevel,
      reference, instructions,
      timePerQuestion: timePerQuestion ? Number(timePerQuestion) : null,
      reviewTimeSeconds: reviewTimeSeconds ? Number(reviewTimeSeconds) : null,
      allowLate: Boolean(allowLate),
      lateDaysLimit: allowLate && lateDaysLimit ? Number(lateDaysLimit) : null,
      provideDefinition: Boolean(provideDefinition),
      maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
      createdById: payload.sub,
      isPublished: Boolean(isPublished),
    },
  })

  // Auto-generate questions
  let questions: Array<{
    position: number; type: QuestionType; prompt: string
    correctAnswer: string; options: string[]; points: number
  }> = []

  if (type === 'VOCABULARY_QUIZ') {
    questions = await generateVocabQuestions(level as CourseLevel, 'GREEK_TO_ENGLISH', Number(numQuestions ?? 10), Number(quizStylePct ?? 0))
  } else if (type === 'MORPHOLOGY_QUIZ') {
    const subtype = (morphologySubtype as MorphologySubtype) ?? 'VERB_PARSING'
    const fields: string[] | undefined = body.fields?.length ? body.fields : undefined
    questions = await generateMorphologyQuestionsBySubtype(subtype, Number(numQuestions ?? 10), vocabThruLesson ?? null, fields, body.parseFilter ?? undefined)
  }

  if (questions.length > 0) {
    await prisma.question.createMany({
      data: questions.map(q => ({ ...q, assignmentId: assignment.id })),
    })
  }

  // Bust the Router Cache so the course page shows the new assignment immediately
  revalidatePath(`/instructor/courses/${courseId}`)
  revalidatePath('/instructor/assignments')

  return NextResponse.json({ assignment }, { status: 201 })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
