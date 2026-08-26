import { NextRequest, NextResponse } from 'next/server'
import { getHomeworkSet } from '@/data/grammar-homework'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isInstructorOfCourse } from '@/lib/course-auth'
import { ensureCourseNotesFoldersForAssignment } from '@/lib/notes'
import { normalizeActivityConfig } from '@/lib/activity-log-submissions'
import { normalizeConstructConfig, parseConstructLink } from '@/lib/construct-assignment'
import {
  generateVocabQuestions, generateVocabPoolFromSelection, generateMorphologyQuestionsBySubtype,
  generateHebrewVocabQuestionsFromSelection, generateHebrewVocabPoolFromSelection,
  generateHebrewMorphologyQuestions,
  type MorphologySubtype, resolveHebrewVocabCap } from '@/lib/quiz-generation'
import type { HebrewMorphologySubtype } from '@/lib/quiz-fields-hebrew'
import { isHebrewLevel } from '@/lib/constants'
import { realignCourseMorphologyCaps } from '@/lib/morph-cap-realign'
import { glossResolver } from '@/lib/vocab-gloss-server'
import type { AssignmentType, QuestionType } from '@/types/assignment'
import type { CourseLevel } from '@/types/course'
import { normalizeWeights } from '@/lib/exam-grading'
import { MIN_LOCKDOWN_AUTOSUBMIT } from '@/lib/constants'
import { requireStudentAccess } from '@/lib/subscription'

// Creating one assignment also generates its questions and, for a vocab quiz, re-aligns
// the course's morphology caps — more than a default-timeout slice of work.
export const maxDuration = 120

export async function GET(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const gate = await requireStudentAccess(payload); if (gate) return gate

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
  const { courseId, title, type, weekNumber, dueDate, level, reference, instructions, homeworkSet, numQuestions, timePerQuestion, reviewTimeSeconds, opensAt, submissionDeadline, round1Deadline, round2Deadline, allowLate, lateDaysLimit, provideDefinition, allowReaderInRound2, glossFrequency, gradeWeights, lockdown, lockdownMaxViolations, maxAppeals, maxRetakes, isPublished, assessed, quizStylePct, vocabSubsections, vocabPos, vocabReviewPct, morphologySubtype, vocabThruLesson, vocabThruBand, notesFolderName, constructUrl, constructCount, constructAskTranslation, constructAskComment, activityWeeks, activityDayOfWeek, activityRequiredWeeks } = body

  // Construct searches: the search link is the assignment, so it is parsed here rather than
  // trusted — what gets stored is the same-origin path it decodes to.
  const constructLink = type === 'CONSTRUCT_SEARCH' ? parseConstructLink(String(constructUrl ?? reference ?? '')) : null
  const constructConfig = type === 'CONSTRUCT_SEARCH'
    ? normalizeConstructConfig({
        requiredCount: constructCount,
        askTranslation: constructAskTranslation,
        askComment: constructAskComment,
      })
    : null

  // Activity logs: how many weeks, which weekday the weekly report is due, and how many
  // weeks must be reported to pass.
  const activityConfig = type === 'ACTIVITY_LOG'
    ? normalizeActivityConfig({
        weeks: activityWeeks,
        dayOfWeek: activityDayOfWeek,
        requiredWeeks: activityRequiredWeeks,
      })
    : null

  // Vocab word selection (frequency subsections + parts of speech) over the BGVB list.
  // perAttempt = how many questions each attempt shows; the quiz stores the whole
  // selected pool and draws perAttempt at random each attempt (different on retake).
  // An EMPTY selection means "nothing chosen", NOT "choose everything". The builder always
  // sends both arrays, so a present-but-empty one used to count as a selection and reach
  // the pool generators with an empty filter — which they read as "no filter" and answered
  // with the entire deck: 1,120 questions for a 20-question quiz (measured on production).
  // Requiring real content sends the empty case to the counted generators below instead.
  const vocabSel = type === 'VOCABULARY_QUIZ'
    && ((Array.isArray(vocabSubsections) && vocabSubsections.length > 0)
        || (Array.isArray(vocabPos) && vocabPos.length > 0))
    ? {
        subsections: Array.isArray(vocabSubsections) ? vocabSubsections : [],
        pos: Array.isArray(vocabPos) ? vocabPos : [],
        perAttempt: Math.min(Math.max(Number(numQuestions ?? 10), 1), 50),
        // % of the pool drawn from subsections EARLIER than the selection
        reviewPct: Math.min(Math.max(Number(vocabReviewPct ?? 0), 0), 100),
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
  const hwSet = type === 'TRANSLATION_EXERCISE' && homeworkSet ? getHomeworkSet(String(homeworkSet)) : undefined
  if (type === 'TRANSLATION_EXERCISE' && homeworkSet && !hwSet) {
    return NextResponse.json({ error: 'Unknown grammar homework set.' }, { status: 400 })
  }
  if ((type === 'TRANSLATION_EXERCISE' || type === 'TRANSLATION_EXAM') && !reference?.trim() && !hwSet) {
    return NextResponse.json({ error: 'At least one passage reference is required.' }, { status: 400 })
  }
  if (type === 'CONSTRUCT_SEARCH' && !constructLink) {
    return NextResponse.json({ error: 'A construct search link is required — copy it from the Construct search page.' }, { status: 400 })
  }
  // A diagramming exercise is its passage — without one there is nothing to diagram.
  if (type === 'DIAGRAM' && !reference?.trim()) {
    return NextResponse.json({ error: 'A passage reference is required.' }, { status: 400 })
  }
  // An activity log with no stated activity is a checkbox with nothing behind it.
  if (type === 'ACTIVITY_LOG' && !String(instructions ?? '').trim()) {
    return NextResponse.json({ error: 'Describe the activity students must complete each week.' }, { status: 400 })
  }
  if (round1Deadline && round2Deadline && new Date(round2Deadline) <= new Date(round1Deadline)) {
    return NextResponse.json({ error: 'Round 2 deadline must be after the Round 1 deadline.' }, { status: 400 })
  }
  // Grammar homework: the due date is the Round 1 cut-off, so a correction
  // round must end after it.
  if (hwSet && round2Deadline && dueDate && new Date(round2Deadline) <= new Date(dueDate)) {
    return NextResponse.json({ error: 'The correction round must end after the due date.' }, { status: 400 })
  }

  const assignment = await prisma.assignment.create({
    data: {
      courseId, title,
      type: type as AssignmentType,
      weekNumber: Number(weekNumber),
      dueDate: new Date(dueDate),
      level: level as CourseLevel,
      reference: constructLink ? constructLink.href : reference?.trim() ? reference : hwSet ? hwSet.title : reference,
      instructions,
      timePerQuestion: timePerQuestion ? Number(timePerQuestion) : null,
      reviewTimeSeconds: reviewTimeSeconds ? Number(reviewTimeSeconds) : null,
      opensAt: opensAt ? new Date(opensAt) : null,
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
      round1Deadline: round1Deadline ? new Date(round1Deadline) : null,
      round2Deadline: round2Deadline ? new Date(round2Deadline) : null,
      allowLate: Boolean(allowLate),
      lateDaysLimit: allowLate && lateDaysLimit ? Number(lateDaysLimit) : null,
      // assessed=false = a class exercise: worked like homework, but no grade — omitted
      // means true, so nothing changes for callers that predate the flag
      assessed: assessed === undefined ? true : Boolean(assessed),
      // For vocab quizzes provideDefinition is derived from the mix: any open-ended
      // portion → typed answers are graded leniently (fuzzy). For other types, use
      // the supplied boolean.
      provideDefinition: type === 'VOCABULARY_QUIZ' && quizStylePct != null
        ? Number(quizStylePct) > 0
        : Boolean(provideDefinition),
      allowReaderInRound2: Boolean(allowReaderInRound2),
      glossFrequency: glossFrequency != null && Number(glossFrequency) > 0 ? Number(glossFrequency) : null,
      gradeWeights: type === 'TRANSLATION_EXAM' ? ({ ...normalizeWeights(gradeWeights) } as Record<string, number>) : undefined,
      lockdown: type === 'TRANSLATION_EXAM' ? Boolean(lockdown) : false,
      // Auto-submit threshold: blank/0 = log-only (never auto-submit). Any positive value
      // is clamped up to MIN_LOCKDOWN_AUTOSUBMIT so a single stray violation can't end an exam.
      lockdownMaxViolations: type === 'TRANSLATION_EXAM' && lockdownMaxViolations != null && Number(lockdownMaxViolations) > 0
        ? Math.max(Number(lockdownMaxViolations), MIN_LOCKDOWN_AUTOSUBMIT) : null,
      maxAppeals: maxAppeals != null && Number(maxAppeals) > 0 ? Number(maxAppeals) : null,
      maxRetakes: maxRetakes != null ? Number(maxRetakes) : null,
      vocabSelection: vocabSel ?? undefined,
      // Course Notes: the folder name each student is given and submits (defaults to the title).
      notesFolderName: type === 'COURSE_NOTES' ? (String(notesFolderName ?? title).trim() || title) : undefined,
      // Construct searches: how many examples to find and which columns to ask for.
      constructConfig: constructConfig
        ? {
            requiredCount: constructConfig.requiredCount,
            askTranslation: constructConfig.askTranslation,
            askComment: constructConfig.askComment,
          }
        : undefined,
      // Activity logs: the weekly schedule and how many weeks are required to pass.
      activityConfig: activityConfig
        ? {
            weeks: activityConfig.weeks,
            dayOfWeek: activityConfig.dayOfWeek,
            requiredWeeks: activityConfig.requiredWeeks,
          }
        : undefined,
      // Morphology quizzes: subtype + full generation recipe, exactly as the semester
      // route stores them. Without these, regenerating a singly-created quiz fell back
      // to VERB_PARSING with no fields and no filter — it silently changed what the
      // quiz tests.
      ...(type === 'MORPHOLOGY_QUIZ'
        ? { morphSubtype: String(morphologySubtype ?? 'VERB_PARSING'),
            vocabThruLesson: !isHebrewLevel(String(level)) && vocabThruLesson != null
              ? Number(vocabThruLesson) : null,
            morphConfig: JSON.parse(JSON.stringify({
              fields: body.fields ?? [],
              // Requested count, kept apart from the stored pool size (a vocab cap can thin
              // the pool below it) so regeneration doesn't ratchet the quiz down.
              numQuestions: Number(numQuestions ?? 10),
              ...(body.parseFilter ? { parseFilter: body.parseFilter } : {}),
              ...(vocabThruBand ? { vocabThruBand } : {}),
            })) }
        : {}),
      createdById: payload.sub,
      isPublished: Boolean(isPublished),
    },
  })

  // Course Notes: give every enrolled student the named folder as soon as it's published.
  if (type === 'COURSE_NOTES' && Boolean(isPublished)) {
    await ensureCourseNotesFoldersForAssignment(assignment.id)
  }

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
    // Assessment is set in the COURSE's language, whatever interface language the instructor
    // happens to be using — a section must be marked against one key.
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { language: true } })
    const resolve = glossResolver(course?.language ?? 'en')
    const glossOf = (w: { word: string; gloss: string }) => resolve(w.word, w.gloss)
    // A Hebrew course draws from the Hebrew deck and stamps Hebrew question types, so the
    // quiz runner knows to render the prompt in Hebrew script, right-to-left.
    const hebrew = isHebrewLevel(String(level))
    if (vocabSel) {
      // Store the full pool; the player draws perAttempt at random each attempt.
      questions = hebrew
        ? generateHebrewVocabPoolFromSelection(vocabSel.subsections, vocabSel.pos, 'HEBREW_TO_ENGLISH', openEndedPct, vocabSel.reviewPct, glossOf)
        : generateVocabPoolFromSelection(vocabSel.subsections, vocabSel.pos, 'GREEK_TO_ENGLISH', openEndedPct, vocabSel.reviewPct, glossOf)
    } else if (hebrew) {
      // No section selection: draw from the whole Hebrew deck. (The Greek branch below goes
      // to the VocabularyItem table, which holds no Hebrew — see generateVocabQuestions.)
      questions = generateHebrewVocabQuestionsFromSelection([], [], 'HEBREW_TO_ENGLISH', Number(numQuestions ?? 10), openEndedPct, glossOf)
    } else {
      questions = await generateVocabQuestions(level as CourseLevel, 'GREEK_TO_ENGLISH', Number(numQuestions ?? 10), openEndedPct, course?.language ?? 'en')
    }
  } else if (type === 'MORPHOLOGY_QUIZ') {
    const fields: string[] | undefined = body.fields?.length ? body.fields : undefined
    if (isHebrewLevel(String(level))) {
      // Hebrew draws on its own pool and field vocabulary (binyan/conjugation/state rather
      // than tense/voice/mood). vocabThruLesson is Greek-only (BGVB lessons); Hebrew's
      // vocabulary cap is the Glanz band, passed through here and stored in morphConfig.
      questions = generateHebrewMorphologyQuestions(
        (morphologySubtype as HebrewMorphologySubtype) ?? 'VERB_PARSING',
        Number(numQuestions ?? 10), fields, body.parseFilter ?? undefined,
        await resolveHebrewVocabCap(courseId, dueDate, Number(weekNumber), vocabThruBand ?? null))
    } else {
      const subtype = (morphologySubtype as MorphologySubtype) ?? 'VERB_PARSING'
      questions = await generateMorphologyQuestionsBySubtype(subtype, Number(numQuestions ?? 10), vocabThruLesson ?? null, fields, body.parseFilter ?? undefined)
    }
  } else if (hwSet) {
    // Grammar homework: one TRANSLATION question per sentence. options[0] carries the
    // word-level model answers as JSON; correctAnswer holds the model translation.
    questions = hwSet.sentences.map((s, i) => ({
      position: i,
      type: 'TRANSLATION' as QuestionType,
      prompt: s.words.map(w => w.w).join(' '),
      correctAnswer: s.translation,
      options: [JSON.stringify({ hw: 1, set: hwSet.id, chapter: hwSet.chapter, words: s.words, note: s.note ?? null })],
      points: 10,
    }))
  }

  if (questions.length > 0) {
    await prisma.question.createMany({
      data: questions.map(q => ({ ...q, assignmentId: assignment.id })),
    })
  }

  // A new vocab quiz changes what "taught by then" means for the course's
  // schedule-following morphology caps — re-align them (coverage-unchanged skip).
  if (type === 'VOCABULARY_QUIZ') {
    await realignCourseMorphologyCaps(courseId, logError)
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
