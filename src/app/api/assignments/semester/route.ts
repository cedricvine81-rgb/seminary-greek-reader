import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions,
  generateVocabQuestionsInRange,
  generateMorphologyQuestionsBySubtype,
  type MorphologySubtype,
  type MorphTestConfig,
} from '@/lib/quiz-generation'
import { getLessonForWeek } from '@/lib/vocab-lesson-map'
import type { AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

const SOURCE_LEVEL: Record<string, CourseLevel> = {
  VOCAB_BUILDER:      'BEGINNING',
  BEGINNING_VOCAB:    'BEGINNING',
  INTERMEDIATE_VOCAB: 'INTERMEDIATE',
}

const SUBTYPE_LABEL: Record<MorphologySubtype, string> = {
  VERB_PARSING:      'Verb Parsing',
  NOUN_PARSING:      'Noun Parsing',
  ADJECTIVE_PARSING: 'Adjective Parsing',
  PRONOUN_PARSING:   'Pronoun Parsing',
  CONDITIONALS:      'Conditional Sentences',
  SUBJUNCTIVES:      'Subjunctive Uses',
  MIXED:             'Mixed Parsing',
}

interface ScheduleItem {
  week: number
  dueDate: string | Date
}

export async function POST(req: NextRequest) {
  try {
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
    isPublished,
    quizStylePct,
    // morphology: either a series (array) or a single subtype for backwards compat
    morphologySeries,
    morphologySubtype,
    vocabThruLesson,
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
    isPublished?: boolean
    quizStylePct?: number
    morphologySeries?: MorphTestConfig[]
    morphologySubtype?: MorphologySubtype
    vocabThruLesson?: number | null
    schedule: ScheduleItem[]
  } = body

  if (!courseId || !schedule?.length) {
    return NextResponse.json({ error: 'courseId and schedule are required.' }, { status: 400 })
  }

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
  const useLessonMap = source === 'VOCAB_BUILDER' && resolvedLevel === 'BEGINNING'

  // Determine which schedule dates to process
  // For a morphology series, only create N assignments (one per test config)
  const isMorphSeries = quizType === 'MORPHOLOGY_QUIZ' && Array.isArray(morphologySeries) && morphologySeries.length > 0
  const effectiveSchedule = isMorphSeries ? schedule.slice(0, morphologySeries!.length) : schedule

  let created = 0

  for (let i = 0; i < effectiveSchedule.length; i++) {
    const item = effectiveSchedule[i]
    const weekNum = Number(item.week)
    const dueDate = new Date(item.dueDate)
    const sourceLabel = QUIZ_SOURCES_LABEL[source] ?? source
    const lesson = useLessonMap ? getLessonForWeek(weekNum) : null

    // Resolve per-test config (series mode vs single subtype)
    const testConfig: MorphTestConfig | null = isMorphSeries
      ? morphologySeries![i]
      : quizType === 'MORPHOLOGY_QUIZ'
        ? { subtype: morphologySubtype ?? 'VERB_PARSING', numQuestions: Number(numQuestions) || 10, vocabThruLesson: vocabThruLesson ?? null, fields: [] }
        : null

    const qCount = testConfig
      ? Math.min(Math.max(testConfig.numQuestions, 1), 50)
      : Math.min(Math.max(Number(numQuestions) || 10, 1), 50)

    // Build title
    let title = `Week ${weekNum} — `
    if (quizType === 'VOCABULARY_QUIZ') {
      title += 'Vocabulary Quiz'
    } else if (testConfig) {
      const seriesNum = isMorphSeries ? ` ${i + 1}` : ''
      title += `Morphology Quiz${seriesNum}: ${SUBTYPE_LABEL[testConfig.subtype]}`
    } else {
      title += 'Morphology Quiz'
    }

    const instructions = lesson
      ? `Source: ${sourceLabel} · ${lesson.section} (${lesson.pages})`
      : quizType === 'MORPHOLOGY_QUIZ' && testConfig?.vocabThruLesson
        ? `Vocabulary through Lesson ${testConfig.vocabThruLesson}`
        : (source ? `Source: ${sourceLabel}` : '')

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        createdById: payload.sub,
        title,
        type: quizType,
        weekNumber: weekNum,
        dueDate,
        level: resolvedLevel,
        instructions: instructions || undefined,
        timePerQuestion: timePerQuestion ? Number(timePerQuestion) : null,
        allowLate: Boolean(allowLate),
        lateDaysLimit: allowLate && lateDaysLimit ? Number(lateDaysLimit) : null,
        provideDefinition: Boolean(provideDefinition),
        maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
        isPublished: Boolean(isPublished),
      },
    })

    let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

    if (quizType === 'VOCABULARY_QUIZ') {
      const pct = Number(quizStylePct ?? 0)
      if (lesson) {
        questions = await generateVocabQuestionsInRange(lesson.rankMin, lesson.rankMax, 'GREEK_TO_ENGLISH', qCount, pct)
      } else {
        questions = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', qCount, pct)
      }
    } else if (testConfig) {
      const fields = testConfig.fields?.length ? testConfig.fields : undefined
      questions = await generateMorphologyQuestionsBySubtype(testConfig.subtype, qCount, testConfig.vocabThruLesson, fields, testConfig.parseFilter ?? undefined)
    }

    if (questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map(q => ({ ...q, assignmentId: assignment.id })),
      })
    }

    created++
  }

  return NextResponse.json({ count: created }, { status: 201 })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

const QUIZ_SOURCES_LABEL: Record<string, string> = {
  VOCAB_BUILDER:      'Biblical Greek Vocabulary Builder (Glanz, Kostyu & Vine)',
  BEGINNING_VOCAB:    'Beginning Greek Vocabulary (50+ occurrences)',
  INTERMEDIATE_VOCAB: 'Intermediate Greek Vocabulary (30+ occurrences)',
}
