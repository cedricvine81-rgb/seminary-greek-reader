import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  generateMorphQuestionsFromConfig, type MorphGenConfig,
  generateHebrewMorphologyQuestions, resolveHebrewVocabCap,
  generateVerbParseQuestions, generateNounParseQuestions,
  generateAdjectiveParseQuestions, generatePronounParseQuestions,
  generateConditionalQuestions, generateSubjunctiveQuestions,
} from '@/lib/quiz-generation'
import type { MorphologySubtype } from '@/lib/quiz-fields'
import type { HebrewMorphologySubtype, HebrewMorphParseFilter } from '@/lib/quiz-fields-hebrew'
import { isHebrewLevel } from '@/lib/constants'
import { normaliseSubtype } from '@/lib/morph-practice-custom'
import { logError } from '@/lib/logger'
import { requireStudentAccess } from '@/lib/subscription'

// FORMATIVE practice for a morphology quiz a student has been set: the same recipe the
// instructor configured, regenerated into DIFFERENT forms so rehearsing is not memorising the
// answers. Students asked to be able to practise parsing the way they already practise
// vocabulary, and the closest thing to "practise my quiz" is the quiz's own recipe.
//
// This route READS the assignment and returns questions. It never writes: the graded quiz's
// Question rows are the instructor's, and a student pressing Practise must not regenerate,
// reorder or replace them. That is the whole reason this is a separate route from
// /api/assignments/[assignmentId]/generate rather than a flag on it.
//
// Nothing is recorded from a practice run — no Submission, no grade, no progress key. The
// end-of-session report the client renders is the entire output.

const PRACTICE_QUESTIONS = 15

export async function GET(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Practice is a paywalled student surface like every other: the pages redirect a lapsed
    // student to /subscribe, and without this the endpoint behind them would still answer.
    const gate = await requireStudentAccess(payload); if (gate) return gate

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      select: {
        id: true, title: true, type: true, level: true, courseId: true, weekNumber: true,
        dueDate: true, isPublished: true, morphSubtype: true, morphConfig: true,
        vocabThruLesson: true,
      },
    })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (assignment.type !== 'MORPHOLOGY_QUIZ') {
      return NextResponse.json({ error: 'Not a morphology quiz' }, { status: 400 })
    }

    // Practice is a study aid for the class it was set to: an enrolled student, or the
    // instructor looking at what their students get. Same shape as the assignment read route.
    if (payload.role === 'STUDENT') {
      const enrolled = await prisma.enrollment.findFirst({
        where: { userId: payload.sub, courseId: assignment.courseId, status: 'APPROVED' },
      })
      if (!enrolled || !assignment.isPublished) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const hebrew = isHebrewLevel(String(assignment.level))
    // Live rows carry VERB_PARSING…; the schema's comment advertised VERB… Accept both, or an
    // unrecognised name falls through the generator's switch to the verb pool and a noun quiz
    // quietly practises verbs.
    const subtype = normaliseSubtype(assignment.morphSubtype)
    const cfg = (assignment.morphConfig ?? null) as
      ({ fields?: string[]; parseFilter?: HebrewMorphParseFilter; vocabThruBand?: string | null } & MorphGenConfig) | null

    let questions
    if (hebrew) {
      questions = generateHebrewMorphologyQuestions(
        subtype as HebrewMorphologySubtype,
        PRACTICE_QUESTIONS, cfg?.fields, cfg?.parseFilter,
        await resolveHebrewVocabCap(
          assignment.courseId, assignment.dueDate, assignment.weekNumber, cfg?.vocabThruBand ?? null),
      )
    } else if (cfg) {
      questions = await generateMorphQuestionsFromConfig(
        subtype as MorphologySubtype,
        PRACTICE_QUESTIONS, assignment.vocabThruLesson, cfg as MorphGenConfig)
    } else {
      // Assignments that predate stored recipes carry only a subtype. The graded quiz falls
      // back to the subtype-only generators in that case and so does practice — a rehearsal of
      // the right part of speech beats refusing to open.
      switch (subtype) {
        case 'NOUN_PARSING':      questions = generateNounParseQuestions(PRACTICE_QUESTIONS); break
        case 'ADJECTIVE_PARSING': questions = generateAdjectiveParseQuestions(PRACTICE_QUESTIONS); break
        case 'PRONOUN_PARSING':   questions = generatePronounParseQuestions(PRACTICE_QUESTIONS); break
        case 'CONDITIONALS':      questions = generateConditionalQuestions(PRACTICE_QUESTIONS); break
        case 'SUBJUNCTIVES':      questions = generateSubjunctiveQuestions(PRACTICE_QUESTIONS); break
        case 'MIXED':             questions = await generateMorphQuestionsFromConfig(
                                    'MIXED', PRACTICE_QUESTIONS, null, null); break
        default:                  questions = generateVerbParseQuestions(PRACTICE_QUESTIONS); break
      }
    }

    return NextResponse.json({
      questions,
      lang: hebrew ? 'hebrew' : 'greek',
      title: assignment.title,
      // True when the forms were limited to the vocabulary taught so far, which is worth
      // saying: it explains why the same quiz deals easier words earlier in the term.
      vocabCapped: hebrew ? !!cfg?.vocabThruBand : assignment.vocabThruLesson != null,
      // No stored recipe means the practice is by part of speech only, not the exact filter.
      approximate: !hebrew && !cfg,
      // Enough of the recipe for the end-of-session "drill these" to rebuild the same KIND of
      // quiz narrowed to what was missed. Not the parse filter: the drill supplies its own.
      subtype,
      fields: cfg?.fields,
      vocabThruLesson: assignment.vocabThruLesson,
      vocabThruBand: cfg?.vocabThruBand ?? null,
    })
  } catch (err) {
    logError('api/assignments/[assignmentId]/practice', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
