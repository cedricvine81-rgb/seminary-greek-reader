import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import {
  generateVocabQuestions, generateVocabQuestionsForLesson, generateVocabQuestionsFromSelection,
  generateHebrewVocabQuestionsFromSelection, generateHebrewMorphologyQuestions,
  generateMorphologyQuestionsBySubtype, type MorphologySubtype,
} from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype } from '@/lib/quiz-fields-hebrew'
import { isHebrewLevel } from '@/lib/constants'
import { getLessonForWeek } from '@/lib/vocab-lesson-map'
import type { AssignmentType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'

// The Greek textbook sources each imply a level. These are BGVB/GNT-frequency sources, so
// they only apply to a Greek course — see the Hebrew guard below.
const SOURCE_LEVEL: Record<string, CourseLevel> = {
  VOCAB_BUILDER:      'BEGINNING',
  BEGINNING_VOCAB:    'BEGINNING',
  INTERMEDIATE_VOCAB: 'INTERMEDIATE',
}

export async function GET(req: NextRequest) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const quizType = (searchParams.get('quizType') ?? 'VOCABULARY_QUIZ') as AssignmentType
  const source   = searchParams.get('source') ?? 'VOCAB_BUILDER'
  const level    = (searchParams.get('level') ?? 'BEGINNING') as CourseLevel
  const morphologySubtype = (searchParams.get('morphologySubtype') ?? 'VERB_PARSING') as MorphologySubtype
  const vocabThruLessonRaw = searchParams.get('vocabThruLesson')
  const vocabThruLesson = vocabThruLessonRaw ? Number(vocabThruLessonRaw) : null
  const count    = Math.min(Math.max(Number(searchParams.get('count') ?? '5'), 1), 10)
  // week param lets us preview the actual lesson for a specific week
  const week     = Number(searchParams.get('week') ?? '1')
  // % of the sample drawn from earlier lessons, so the preview matches the builder slider
  const prevPct  = Math.min(Math.max(Number(searchParams.get('prevPct') ?? '0'), 0), 100)
  // The frequency sections the instructor has ticked. When present they are what the quiz
  // will actually be built from, so the preview must use them rather than the lesson map.
  const subsections = (searchParams.get('subsections') ?? '').split(',').filter(Boolean)
  // Which parse fields a morphology quiz tests — the preview is otherwise a different quiz
  // from the one being configured.
  const fields = (searchParams.get('fields') ?? '').split(',').filter(Boolean)

  // A Hebrew course keeps its own level: the SOURCE_LEVEL table maps Greek textbook sources,
  // and letting it win here is what previously previewed Greek words on a Hebrew quiz.
  const hebrew = isHebrewLevel(String(level))
  const resolvedLevel: CourseLevel = hebrew ? level : (SOURCE_LEVEL[source] ?? level)
  // The lesson map is the BGVB week-by-week schedule — Greek only, and only when no explicit
  // section selection overrides it.
  const useLessonMap = !hebrew && subsections.length === 0
    && source === 'VOCAB_BUILDER' && resolvedLevel === 'BEGINNING'
  const lesson = useLessonMap ? getLessonForWeek(week) : null

  let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

  if (quizType === 'VOCABULARY_QUIZ') {
    if (hebrew) {
      questions = generateHebrewVocabQuestionsFromSelection(
        subsections, [], 'HEBREW_TO_ENGLISH', count)
    } else if (lesson) {
      questions = generateVocabQuestionsForLesson(lesson.lesson, 'GREEK_TO_ENGLISH', count, 0, prevPct)
    } else if (subsections.length > 0) {
      questions = generateVocabQuestionsFromSelection(
        subsections, [], 'GREEK_TO_ENGLISH', count)
    } else {
      questions = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', count)
    }
  } else if (quizType === 'MORPHOLOGY_QUIZ') {
    questions = hebrew
      ? generateHebrewMorphologyQuestions(
          morphologySubtype as unknown as HebrewMorphologySubtype, count, fields)
      : await generateMorphologyQuestionsBySubtype(morphologySubtype, count, vocabThruLesson, fields)
  }

  // `lang` tells the preview modal which script to set the prompts in.
  return NextResponse.json({ questions, lesson, lang: hebrew ? 'hebrew' : 'greek' })

  } catch (err) {
    logError('api/assignments/sample', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
