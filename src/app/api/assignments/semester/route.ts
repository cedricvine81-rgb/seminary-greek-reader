import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { generateVocabQuestions, generateMorphologyQuestions } from '@/lib/quiz-generation'
import type { AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

// Maps quiz source → the level passed to the question generator.
// VOCAB_BUILDER uses the same vocabulary pool as BEGINNING since the Vocab
// Builder covers the most-frequent GNT words.
const SOURCE_LEVEL: Record<string, CourseLevel> = {
  VOCAB_BUILDER:      'BEGINNING',
  BEGINNING_VOCAB:    'BEGINNING',
  INTERMEDIATE_VOCAB: 'INTERMEDIATE',
}

interface ScheduleItem {
  week: number
  dueDate: string | Date
}

export async function POST(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    courseId,
    quizType,
    source,
    level,
    numQuestions,
    schedule,
  }: {
    courseId: string
    quizType: AssignmentType
    source: string
    level: CourseLevel
    numQuestions: number
    schedule: ScheduleItem[]
  } = body

  if (!courseId || !schedule?.length) {
    return NextResponse.json({ error: 'courseId and schedule are required.' }, { status: 400 })
  }

  // Verify the course belongs to this instructor
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, name: true },
  })
  if (!course || course.instructorId !== payload.sub) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
  }

  const resolvedLevel: CourseLevel = SOURCE_LEVEL[source] ?? (level as CourseLevel)
  const qCount = Math.min(Math.max(Number(numQuestions) || 10, 1), 50)

  // Build one assignment per schedule entry, batching question generation.
  // Generate a shared question pool then slice per assignment to avoid
  // hitting the DB once per quiz.
  const totalNeeded = schedule.length * qCount
  let questionPool: Awaited<ReturnType<typeof generateVocabQuestions>> = []

  if (quizType === 'VOCABULARY_QUIZ') {
    questionPool = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', totalNeeded)
  } else if (quizType === 'MORPHOLOGY_QUIZ') {
    questionPool = await generateMorphologyQuestions(totalNeeded)
  }

  let created = 0

  for (const item of schedule) {
    const weekNum = Number(item.week)
    const dueDate = new Date(item.dueDate)
    const sourceLabel = QUIZ_SOURCES_LABEL[source] ?? source

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        createdById: payload.sub,
        title: `Week ${weekNum} — ${quizType === 'VOCABULARY_QUIZ' ? 'Vocabulary Quiz' : 'Morphology Quiz'}`,
        type: quizType,
        weekNumber: weekNum,
        dueDate,
        level: resolvedLevel,
        instructions: `Source: ${sourceLabel}`,
        isPublished: false,
      },
    })

    const slice = questionPool.slice(created * qCount, (created + 1) * qCount)

    if (slice.length > 0) {
      await prisma.question.createMany({
        data: slice.map(q => ({ ...q, assignmentId: assignment.id })),
      })
    }

    created++
  }

  return NextResponse.json({ count: created }, { status: 201 })
}

const QUIZ_SOURCES_LABEL: Record<string, string> = {
  VOCAB_BUILDER:      'Biblical Greek Vocabulary Builder (Glanz, Kostyu & Vine)',
  BEGINNING_VOCAB:    'Beginning Greek Vocabulary (50+ occurrences)',
  INTERMEDIATE_VOCAB: 'Intermediate Greek Vocabulary (30+ occurrences)',
}
