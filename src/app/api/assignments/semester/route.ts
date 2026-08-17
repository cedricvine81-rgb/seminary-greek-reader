import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions,
  generateVocabQuestionsForLesson,
  generateVocabQuestionsFromSelection,
  generateHebrewVocabQuestionsFromSelection,
  generateHebrewVocabPoolFromSelection,
  generateHebrewMorphologyQuestions,
  generateMorphologyQuestionsBySubtype,
  generateMorphQuestionsFromConfig,
  type MorphologySubtype,
  type MorphTestConfig,
  resolveHebrewVocabCap,
} from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'
import { isHebrewLevel } from '@/lib/constants'
import { HEBREW_DECK } from '@/lib/vocab-decks'
import { glossResolver } from '@/lib/vocab-gloss-server'
import { getLessonForWeek, lessonSubsectionKey } from '@/lib/vocab-lesson-map'
import type { AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

// Greek textbook sources, each implying a level. Not consulted for a Hebrew course.
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
    hebrewVocabSchedule,
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
    hebrewVocabSchedule?: 'glanz' | 'sections' | 'custom'
  } = body

  // If the instructor picked frequency sections, that selection overrides the
  // per-week lesson rank-range distribution for vocab quizzes (same words pool
  // each week) and is saved on each created quiz so it can be edited later.
  const rawVocabSel = quizType === 'VOCABULARY_QUIZ' && Array.isArray(vocabSubsections) && vocabSubsections.length > 0
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

  // A Hebrew course keeps its own level — SOURCE_LEVEL maps Greek textbook sources, and
  // letting it win here would store a Greek level on every quiz in the series.
  const hebrew = isHebrewLevel(String(level))
  const resolvedLevel: CourseLevel = hebrew ? (level as CourseLevel) : (SOURCE_LEVEL[source] ?? (level as CourseLevel))

  // THE SCHEDULE WINS unless the instructor explicitly chose to pick sections. The section
  // picker is HIDDEN in the two weekly modes, so a selection made before the course was
  // switched to Hebrew survives in the form where nobody can see or clear it — and, being
  // truthy, silently replaced the whole weekly plan: every week the same 320-word pool and
  // no section in the title. That is exactly how the FA2026 quizzes lost their schedule
  // (2026-08-17). The server, not the form, now decides.
  const vocabSel = hebrew && hebrewVocabSchedule && hebrewVocabSchedule !== 'custom' ? null : rawVocabSel
  // The lesson map is the BGVB week-by-week schedule: Greek only.
  const useLessonMap = !hebrew && source === 'VOCAB_BUILDER' && resolvedLevel === 'BEGINNING'

  // Determine which schedule dates to process
  // For a morphology series, only create N assignments (one per test config)
  const isMorphSeries = quizType === 'MORPHOLOGY_QUIZ' && Array.isArray(morphologySeries) && morphologySeries.length > 0
  const effectiveSchedule = isMorphSeries ? schedule.slice(0, morphologySeries!.length) : schedule

  // One resolver for the whole semester: every week's quiz is set in the course's language.
  const semesterCourse = await prisma.course.findUnique({ where: { id: courseId }, select: { language: true } })
  const resolveGloss = glossResolver(semesterCourse?.language ?? 'en')

  let created = 0

  for (let i = 0; i < effectiveSchedule.length; i++) {
    const item = effectiveSchedule[i]
    const weekNum = Number(item.week)
    const dueDate = new Date(item.dueDate)
    const sourceLabel = QUIZ_SOURCES_LABEL[source] ?? source
    const lesson = useLessonMap ? getLessonForWeek(weekNum) : null
    // Hebrew's counterpart of the Greek lesson map. With no explicit selection, week N draws
    // from Glanz band N (Glanz assigns 20 words a week; the bands are 20 ranks each) with the
    // review slider's share from earlier bands; weeks past band 1L become cumulative review
    // over the whole list. This is what an unconfigured Hebrew series MEANS — before this
    // clause it silently meant "the whole deck, every week", so week 1 could quiz week-12
    // words (the flat pool scripts/fix-hebrew-vocab-quizzes.ts repaired on FA2026).
    const hebrewWeekly = hebrew && quizType === 'VOCABULARY_QUIZ' && !vocabSel
      ? (() => {
          // Two schedules, the instructor's choice: Glanz bands (the printed list OTST 551
          // assigns week by week) or the Hebrew vocabulary page's own §-sections — both are
          // 20-word slices, but of DIFFERENTLY ORDERED frequency lists, so week 3 is a
          // different twenty words under each.
          const useSections = hebrewVocabSchedule === 'sections'
          const keys = useSections
            ? HEBREW_DECK.allSubsectionKeys
            : (HEBREW_DECK.bands ?? []).map(b => b.key)
          const review = weekNum > keys.length
          const subsections = review ? keys : [keys[Math.max(1, weekNum) - 1]]
          const reviewPct = review || weekNum <= 1 ? 0
            : Math.min(Math.max(Number(prevSectionsPct ?? 0), 0), 100)
          const label = review
            ? (useSections ? '§ review' : 'Glanz review')
            : (useSections ? `§${subsections[0]}` : subsections[0])
          return { subsections, reviewPct, label }
        })()
      : null

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
      // A manual selection is the same words every week, so name its span rather than
      // leaving the instructor to guess what a title-less quiz covers.
      if (!hebrewWeekly && vocabSel && vocabSel.subsections.length > 0) {
        const keys = vocabSel.subsections
        title += keys.length === 1 ? ` (§${keys[0]})` : ` (§${keys[0]}–${keys[keys.length - 1]})`
      }
      // The week's slice goes in the title — "(§1-A)" for the Greek lesson map, "(Glanz 1A)"
      // or "(§1-A)" for the Hebrew schedules — so a student can open the Vocab page and see
      // the exact material the quiz draws on. The series bulk actions also parse the Greek
      // suffix back out when regenerating, so it is load-bearing, not decoration.
      const lessonKey = lesson ? lessonSubsectionKey(lesson.lesson) : null
      if (lessonKey) title += ` (§${lessonKey})`
      if (hebrewWeekly) title += ` (${hebrewWeekly.label})`
    } else if (testConfig) {
      const topic = testConfig.topic?.trim() || SUBTYPE_LABEL[testConfig.subtype]
      title += name ? `${name} (${topic})` : `Morphology Quiz${isMorphSeries ? ` ${i + 1}` : ''}: ${topic}`
    } else {
      title += name ?? 'Morphology Quiz'
    }

    const instructions = lesson
      ? `Source: ${sourceLabel} · ${lesson.section} (${lesson.pages})`
      : quizType === 'MORPHOLOGY_QUIZ' && !hebrew && testConfig?.vocabThruLesson
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
        // Persist the cumulative-review share and the multiple-choice/fill-in balance so
        // regenerating this quiz later keeps both.
        ...(quizType === 'VOCABULARY_QUIZ'
          ? { vocabReviewPct: Math.min(Math.max(Number(prevSectionsPct ?? 0), 0), 100),
              vocabFillPct: Math.min(Math.max(Number(quizStylePct ?? 0), 0), 100) }
          : {}),
        ...(testConfig
          ? { morphSubtype: testConfig.subtype,
              // The lesson cap is a BGVB (Greek) schedule; Hebrew has no lesson map, so
              // storing one would make a later regeneration filter on nothing.
              vocabThruLesson: hebrew ? null : testConfig.vocabAuto ? weekNum : testConfig.vocabThruLesson ?? null,
              // The full recipe, so the quiz can be regenerated faithfully later.
              morphConfig: JSON.parse(JSON.stringify({ fields: testConfig.fields ?? [],
                ...(testConfig.parseFilter ? { parseFilter: testConfig.parseFilter } : {}),
                ...(testConfig.vocabThruBand ? { vocabThruBand: testConfig.vocabThruBand } : {}),
                ...(testConfig.declensions?.length ? { declensions: testConfig.declensions } : {}) })) }
          : {}),
        maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
        // Vocab quizzes only — ignore non-positive values
        maxAppeals: quizType === 'VOCABULARY_QUIZ' && maxAppeals != null && Number(maxAppeals) > 0
          ? Number(maxAppeals)
          : null,
        vocabSelection: hebrewWeekly
          ? { subsections: hebrewWeekly.subsections, pos: [], perAttempt: qCount,
              reviewPct: hebrewWeekly.reviewPct }
          : vocabSel ?? undefined,
        isPublished: Boolean(isPublished),
      },
    })

    let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

    if (quizType === 'VOCABULARY_QUIZ') {
      const pct = Number(quizStylePct ?? 0)
      const glossOf = (w: { word: string; gloss: string }) => resolveGloss(w.word, w.gloss)
      if (hebrew) {
        // The Hebrew deck and its own question type, so the runner sets the prompt in
        // Hebrew script right-to-left. No selection = the weekly Glanz schedule (a stored
        // pool of the band + its review words; the player samples perAttempt each try);
        // an explicit selection is respected as given.
        questions = hebrewWeekly
          ? generateHebrewVocabPoolFromSelection(
              hebrewWeekly.subsections, [], 'HEBREW_TO_ENGLISH', pct, hebrewWeekly.reviewPct, glossOf)
          : generateHebrewVocabQuestionsFromSelection(
              vocabSel?.subsections ?? [], vocabSel?.pos ?? [], 'HEBREW_TO_ENGLISH', qCount, pct, glossOf)
      } else if (vocabSel) {
        // Instructor picked sections → draw every week's quiz from those words.
        questions = generateVocabQuestionsFromSelection(vocabSel.subsections, vocabSel.pos, 'GREEK_TO_ENGLISH', qCount, pct, glossOf)
      } else if (lesson) {
        // Mix in cumulative review from every lesson before this week's range.
        questions = generateVocabQuestionsForLesson(
          lesson.lesson, 'GREEK_TO_ENGLISH', qCount, pct, Number(prevSectionsPct ?? 0), glossOf)
      } else {
        questions = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', qCount, pct)
      }
    } else if (testConfig && hebrew) {
      // Hebrew draws on its own pool and field vocabulary (binyan/conjugation/state rather
      // than tense/voice/mood). vocabThruLesson is a BGVB lesson cap, so it does not apply.
      questions = generateHebrewMorphologyQuestions(
        testConfig.subtype as unknown as HebrewMorphologySubtype,
        qCount,
        testConfig.fields,
        testConfig.parseFilter as unknown as HebrewMorphParseFilter | undefined,
        // 'auto' = follow this course's vocab quizzes (schedule-agnostic); with none yet
        // — e.g. the morphology series is built before the vocab series — falls back to
        // week→Glanz band, and the bulk "morphVocab" regeneration re-aligns later.
        await resolveHebrewVocabCap(courseId, dueDate, weekNum, testConfig.vocabThruBand ?? null))
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
