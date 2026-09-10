import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { requireStudentAccess } from '@/lib/subscription'
import { getPayload } from '@/lib/auth'
import { morphQuizFor, MORPH_QUIZ_QUESTIONS } from '@/lib/self-study-morph'
import {
  generateMorphologyQuestionsBySubtype,
  generateHebrewMorphologyQuestions,
} from '@/lib/quiz-generation'

// Questions for a self-study morphology (parsing) quiz — generated fresh per request from
// the same corpus pools the instructor quizzes use, so every retake deals new forms. The
// recipe (subtype, parse filter, tested fields, vocabulary cap) comes from the
// self-study-morph registry; this route exists because the pools are server-only.
// Gated on login only, like the progress store: no course, no Assignment row.

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const ENDINGS: Record<'contract' | 'mi', RegExp> = { contract: /[εαο]ω$/, mi: /μι$/ }

export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Practice is a paywalled student surface like every other: the pages redirect a lapsed
    // student to /subscribe, and without this the endpoint behind them would still answer.
    const gate = await requireStudentAccess(payload); if (gate) return gate

    const track = req.nextUrl.searchParams.get('track') ?? ''
    const lesson = Number(req.nextUrl.searchParams.get('lesson'))
    const def = Number.isInteger(lesson) ? morphQuizFor(track, lesson) : null
    if (!def) return NextResponse.json({ error: 'No such quiz' }, { status: 404 })

    let questions
    if (def.lang === 'hebrew') {
      questions = generateHebrewMorphologyQuestions(
        def.subtype, MORPH_QUIZ_QUESTIONS, def.fields, def.parseFilter, def.vocabThruBand ?? null,
      )
    } else {
      const parts = await Promise.all(def.subtypes.map(({ subtype, count }) =>
        // Lexeme-ending quizzes (contract / μι verbs) over-generate and post-filter by the
        // question's own lexeme; at 200 the request comfortably covers the measured pool
        // sizes (70 contract / 153 μι forms). This used to dig the lemma back out of the
        // display prompt with a regex because the generator exposed no lexeme — it does now.
        generateMorphologyQuestionsBySubtype(
          subtype, def.lexemeEnding ? 200 : count, def.vocabThruLesson, def.fields, def.parseFilter,
        ).then(qs => def.lexemeEnding
          ? qs.filter(q => ENDINGS[def.lexemeEnding!].test(stripAccents(q.lexeme ?? ''))).slice(0, count)
          : qs),
      ))
      questions = parts.flat().map((q, i) => ({ ...q, position: i + 1 }))
    }

    return NextResponse.json(
      { questions },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    logError('self-study-morph GET', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
