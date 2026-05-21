import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const quizType = (searchParams.get('quizType') ?? 'VOCABULARY_QUIZ') as AssignmentType
  const source   = searchParams.get('source') ?? 'VOCAB_BUILDER'
  const level    = (searchParams.get('level') ?? 'BEGINNING') as CourseLevel
  const count    = Math.min(Math.max(Number(searchParams.get('count') ?? '5'), 1), 10)
  // week param lets us preview the actual lesson for a specific week
  const week     = Number(searchParams.get('week') ?? '1')

  const resolvedLevel: CourseLevel = SOURCE_LEVEL[source] ?? level
  const useLessonMap = source === 'VOCAB_BUILDER' && resolvedLevel === 'BEGINNING'
  const lesson = useLessonMap ? getLessonForWeek(week) : null

  let questions: Awaited<ReturnType<typeof generateVocabQuestions>> = []

  if (quizType === 'VOCABULARY_QUIZ') {
    if (lesson) {
      questions = await generateVocabQuestionsInRange(lesson.rankMin, lesson.rankMax, 'GREEK_TO_ENGLISH', count)
    } else {
      questions = await generateVocabQuestions(resolvedLevel, 'GREEK_TO_ENGLISH', count)
    }
  } else if (quizType === 'MORPHOLOGY_QUIZ') {
    questions = await generateMorphologyQuestions(count)
  }

  return NextResponse.json({ questions, lesson })
}
