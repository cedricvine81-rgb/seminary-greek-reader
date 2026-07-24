import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions,
  generateVocabQuestionsForLesson,
  generateVocabQuestionsFromSelection,
  generateMorphologyQuestionsBySubtype,
  generateMorphQuestionsFromConfig,
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
    maxAppeals,
    isPublished,
    quizStylePct,
    // morphology: either a series (array) or a single subtype for backwards compat
    morphologySeries,
    morphologySubtype,
    vocabThruLesson,
    vocabSubsections,
    prevSectionsPct,
    seriesName,
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
    maxAppeals?: number | null
    isPublished?: boolean
    quizStylePct?: number
    morphologySeries?: MorphTestConfig[]
    morphologySubtype?: MorphologySubtype
    vocabThruLesson?: number | null
    vocabSubsections?: string[]
    prevSectionsPct?: number   // % of each vocab quiz drawn from EARLIER lessons
    seriesName?: string        // custom series name for the quiz titles (and series grouping)
    schedule: ScheduleItem[]
  } = body

  // If the instructor picked frequency sections, that selection overrides the
  // per-week lesson rank-range distribution for vocab quizzes (same words pool
  // each week) and is saved on each created quiz so it can be edited later.
  const vocabSel = quizType === 'VOCABULARY_QUIZ' && Array.isArray(vocabSubsections) && vocabSubsections.length > 0
    ? { subsections: vocabSubsections, pos: [] as string[] }
    : null

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
    // "Week N — <series> (<topic>)": a custom series name groups the run under that name in
    // the course page's series editor; per-test topics give each quiz a readable title.
    const name = typeof seriesName === 'string' && seriesName.trim() ? seriesName.trim() : null
    let title = `Week ${weekNum} — `
    if (quizType === 'VOCABULARY_QUIZ') {
      title += name ?? 'Vocabulary Quiz'
    } else if (testConfig) {
      const topic = testConfig.topic?.trim() || SUBTYPE_LABEL[testConfig.subtype]
      title += name ? `${name} (${topic})` : `Morphology Quiz${isMorphSeries ? ` ${i + 1}` : ''}: ${topic}`
    } else {
      title += name ?? 'Morphology Quiz'
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
        // Persist the cumulative-review share so regenerating this quiz later keeps it.
        ...(quizType === 'VOCABULARY_QUIZ'
          ? { vocabReviewPct: Math.min(Math.max(Number(prevSectionsPct ?? 0), 0), 100) }
          : {}),
        ...(testConfig
          ? { morphSubtype: testConfig.subtype,
              vocabThruLesson: testConfig.vocabAuto ? weekNum : testConfig.vocabThruLesson ?? null,
              // The full recipe, so the quiz can be regenerated faithfully later.
              morphConfig: JSON.parse(JSON.stringify({ fields: testConfig.fields ?? [],
                ...(testConfig.parseFilter ? { parseFilter: testConfig.parseFilter } : {}),
                ...(testConfig.declensions?.length ? { declensions: testConfig.declensions } : {}) })) }
          : {}),
        maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
        // Vocab quizzes only — ignore non-positive values
        maxAppeals: quizType === 'VOCABULARY_QUIZ' && maxAppeals != null && Number(maxAppeals) > 0
          ? Number(maxAppeals)
          : null,
        vocabSelection: vocabSel ?? undefined,
        isPublished: Boolean(isPublished),
      },
    })

    let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

    if (quizType === 'VOCABULARY_QUIZ') {
      const pct = Number(quizStylePct ?? 0)
      if (vocabSel) {
        // Instructor picked sections → draw every week's quiz from those words.
        questions = generateVocabQuestionsFromSelection(vocabSel.subsections, vocabSel.pos, 'GREEK_TO_ENGLISH', qCount, pct)
      } else if (lesson) {
        // Mix in cumulative review from every lesson before this week's range.
        questions = generateVocabQuestionsForLesson(
          lesson.lesson, 'GREEK_TO_ENGLISH', qCount, pct, Number(prevSectionsPct ?? 0))
      } else {
        questions = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', qCount, pct)
      }
    } else if (testConfig) {
      // vocabAuto ties the quiz to the vocabulary schedule: week N tests only words
      // taught through lesson N, so students are never parsing unseen vocabulary.
      const thruLesson = testConfig.vocabAuto ? weekNum : testConfig.vocabThruLesson
      questions = await generateMorphQuestionsFromConfig(testConfig.subtype, qCount, thruLesson ?? null,
        { fields: testConfig.fields, parseFilter: testConfig.parseFilter, declensions: testConfig.declensions })
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
    logError('api/assignments/semester', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

const QUIZ_SOURCES_LABEL: Record<string, string> = {
  VOCAB_BUILDER:      'Biblical Greek Vocabulary Builder (Glanz, Kostyu & Vine)',
  BEGINNING_VOCAB:    'Beginning Greek Vocabulary (50+ occurrences)',
  INTERMEDIATE_VOCAB: 'Intermediate Greek Vocabulary (30+ occurrences)',
}
