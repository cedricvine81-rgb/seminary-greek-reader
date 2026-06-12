import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { generateVocabQuestions, generateMorphologyQuestionsBySubtype, type MorphologySubtype } from '@/lib/quiz-generation'
import type { AssignmentType, QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

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
    logError('api/assignments', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { courseId, title, type, weekNumber, dueDate, level, reference, instructions, numQuestions, timePerQuestion, reviewTimeSeconds, round1Deadline, round2Deadline, allowLate, lateDaysLimit, provideDefinition, allowReaderInRound2, maxAppeals, maxRetakes, isPublished, quizStylePct, morphologySubtype, vocabThruLesson } = body

  // Validate required fields
  if (!courseId || !title || !type || !weekNumber || !dueDate || !level) {
    return NextResponse.json({ error: 'courseId, title, type, weekNumber, dueDate, and level are required.' }, { status: 400 })
  }
  if (type === 'TRANSLATION_EXERCISE' && !reference?.trim()) {
    return NextResponse.json({ error: 'A passage reference is required for Translation Exercise assignments.' }, { status: 400 })
  }
  if (round1Deadline && round2Deadline && new Date(round2Deadline) <= new Date(round1Deadline)) {
    return NextResponse.json({ error: 'Round 2 deadline must be after the Round 1 deadline.' }, { status: 400 })
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
      round1Deadline: round1Deadline ? new Date(round1Deadline) : null,
      round2Deadline: round2Deadline ? new Date(round2Deadline) : null,
      allowLate: Boolean(allowLate),
      lateDaysLimit: allowLate && lateDaysLimit ? Number(lateDaysLimit) : null,
      provideDefinition: Boolean(provideDefinition),
      allowReaderInRound2: Boolean(allowReaderInRound2),
      maxAppeals: maxAppeals != null && Number(maxAppeals) > 0 ? Number(maxAppeals) : null,
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
    // provideDefinition=true → 100% open-ended; false → 0% (all multiple-choice)
    const openEndedPct = Boolean(provideDefinition) ? 100 : 0
    questions = await generateVocabQuestions(level as CourseLevel, 'GREEK_TO_ENGLISH', Number(numQuestions ?? 10), openEndedPct)
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
    logError('api/assignments', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
