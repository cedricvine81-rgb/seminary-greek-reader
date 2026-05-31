import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { generateVocabQuestions, generateVocabQuestionsInRange, generateMorphologyQuestions } from '@/lib/quiz-generation'
import { getLessonForWeek } from '@/lib/vocab-lesson-map'
import type { AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

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
    timePerQuestion,
    allowLate,
    lateDaysLimit,
    provideDefinition,
    maxRetakes,
    schedule,
  }: {
    courseId: string
    quizType: AssignmentType
    source: string
    level: CourseLevel
    numQuestions: number
    timePerQuestion?: number
    allowLate?: boolean
    lateDaysLimit?: number
    provideDefinition?: boolean
    maxRetakes?: number | null
    schedule: ScheduleItem[]
  } = body

  if (!courseId || !schedule?.length) {
    return NextResponse.json({ error: 'courseId and schedule are required.' }, { status: 400 })
  }

  // Verify the instructor has access to this course (primary or co-instructor)
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    select: { name: true },
  })
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
  }

  const resolvedLevel: CourseLevel = SOURCE_LEVEL[source] ?? (level as CourseLevel)
  const qCount = Math.min(Math.max(Number(numQuestions) || 10, 1), 50)
  const useLessonMap = source === 'VOCAB_BUILDER' && resolvedLevel === 'BEGINNING'

  let created = 0

  for (const item of schedule) {
    const weekNum = Number(item.week)
    const dueDate = new Date(item.dueDate)
    const sourceLabel = QUIZ_SOURCES_LABEL[source] ?? source
    const lesson = useLessonMap ? getLessonForWeek(weekNum) : null

    const instructions = lesson
      ? `Source: ${sourceLabel} · ${lesson.section} (${lesson.pages})`
      : `Source: ${sourceLabel}`

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        createdById: payload.sub,
        title: `Week ${weekNum} — ${quizType === 'VOCABULARY_QUIZ' ? 'Vocabulary Quiz' : 'Morphology Quiz'}`,
        type: quizType,
        weekNumber: weekNum,
        dueDate,
        level: resolvedLevel,
        instructions,
        timePerQuestion: timePerQuestion ? Number(timePerQuestion) : null,
        allowLate: Boolean(allowLate),
        lateDaysLimit: allowLate && lateDaysLimit ? Number(lateDaysLimit) : null,
        provideDefinition: Boolean(provideDefinition),
        maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
        isPublished: false,
      },
    })

    let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

    if (quizType === 'VOCABULARY_QUIZ') {
      if (lesson) {
        questions = await generateVocabQuestionsInRange(lesson.rankMin, lesson.rankMax, 'GREEK_TO_ENGLISH', qCount)
      } else {
        questions = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', qCount)
      }
    } else if (quizType === 'MORPHOLOGY_QUIZ') {
      questions = await generateMorphologyQuestions(qCount)
    }

    if (questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map(q => ({ ...q, assignmentId: assignment.id })),
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
