import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isInstructorOfCourse } from '@/lib/course-auth'
import { generateVocabQuestions, generateVocabPoolFromSelection, generateMorphologyQuestionsBySubtype, type MorphologySubtype } from '@/lib/quiz-generation'
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
  const { courseId, title, type, weekNumber, dueDate, level, reference, instructions, numQuestions, timePerQuestion, reviewTimeSeconds, submissionDeadline, round1Deadline, round2Deadline, allowLate, lateDaysLimit, provideDefinition, allowReaderInRound2, glossFrequency, maxAppeals, maxRetakes, isPublished, quizStylePct, vocabSubsections, vocabPos, morphologySubtype, vocabThruLesson } = body

  // Vocab word selection (frequency subsections + parts of speech) over the BGVB list.
  // perAttempt = how many questions each attempt shows; the quiz stores the whole
  // selected pool and draws perAttempt at random each attempt (different on retake).
  const vocabSel = type === 'VOCABULARY_QUIZ' && (Array.isArray(vocabSubsections) || Array.isArray(vocabPos))
    ? {
        subsections: Array.isArray(vocabSubsections) ? vocabSubsections : [],
        pos: Array.isArray(vocabPos) ? vocabPos : [],
        perAttempt: Math.min(Math.max(Number(numQuestions ?? 10), 1), 50),
      }
    : null

  // Validate required fields
  if (!courseId || !title || !type || !weekNumber || !dueDate || !level) {
    return NextResponse.json({ error: 'courseId, title, type, weekNumber, dueDate, and level are required.' }, { status: 400 })
  }
  // Authorization: the instructor must actually teach (or co-teach) this course.
  if (!await isInstructorOfCourse(courseId, payload.sub)) {
    return NextResponse.json({ error: 'You do not teach this course.' }, { status: 403 })
  }
  if ((type === 'TRANSLATION_EXERCISE' || type === 'TRANSLATION_EXAM') && !reference?.trim()) {
    return NextResponse.json({ error: 'At least one passage reference is required.' }, { status: 400 })
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
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
      round1Deadline: round1Deadline ? new Date(round1Deadline) : null,
      round2Deadline: round2Deadline ? new Date(round2Deadline) : null,
      allowLate: Boolean(allowLate),
      lateDaysLimit: allowLate && lateDaysLimit ? Number(lateDaysLimit) : null,
      // For vocab quizzes provideDefinition is derived from the mix: any open-ended
      // portion → typed answers are graded leniently (fuzzy). For other types, use
      // the supplied boolean.
      provideDefinition: type === 'VOCABULARY_QUIZ' && quizStylePct != null
        ? Number(quizStylePct) > 0
        : Boolean(provideDefinition),
      allowReaderInRound2: Boolean(allowReaderInRound2),
      glossFrequency: glossFrequency != null && Number(glossFrequency) > 0 ? Number(glossFrequency) : null,
      maxAppeals: maxAppeals != null && Number(maxAppeals) > 0 ? Number(maxAppeals) : null,
      maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
      vocabSelection: vocabSel ?? undefined,
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
    // Continuous Type-of-Quiz mix: quizStylePct (0–100) is the % of open-ended
    // ("provide definition") questions; the remainder are multiple-choice. Falls
    // back to the binary provideDefinition when no slider value was sent.
    const openEndedPct = quizStylePct != null
      ? Math.min(Math.max(Number(quizStylePct), 0), 100)
      : Boolean(provideDefinition) ? 100 : 0
    // If the instructor picked frequency sections / parts of speech, draw the
    // quiz from exactly those words (BGVB list); otherwise fall back to the
    // course-level pool from the database.
    if (vocabSel) {
      // Store the full pool; the player draws perAttempt at random each attempt.
      questions = generateVocabPoolFromSelection(vocabSel.subsections, vocabSel.pos, 'GREEK_TO_ENGLISH', openEndedPct)
    } else {
      questions = await generateVocabQuestions(level as CourseLevel, 'GREEK_TO_ENGLISH', Number(numQuestions ?? 10), openEndedPct)
    }
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
