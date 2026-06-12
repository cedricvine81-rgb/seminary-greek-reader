import { prisma } from './db'
import type { QuestionType } from '@/types/assignment'
import { isAnswerCorrect, isMultipleChoiceCorrect, fuzzyMatch, normalise } from './answer-matching'

/**
 * Look up curated English synonyms for a Greek lemma. Returns [] if the lemma
 * isn't in the lexicon or has no curated synonyms. Tolerant of mismatched
 * accents (some quiz prompts may differ in diacritics from the lexicon entry).
 */
export async function getLemmaSynonyms(lemma: string): Promise<string[]> {
  if (!lemma) return []
  // Exact match first (fast path on the unique index)
  let lex = await prisma.lexicalEntry.findFirst({
    where: { lexeme: lemma },
    select: { acceptedAnswers: true },
  })
  // Fallback: strip diacritics on both sides if the exact match failed
  if (!lex) {
    const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
    const stripped = strip(lemma)
    const candidates = await prisma.lexicalEntry.findMany({
      where: { lexeme: { startsWith: stripped.slice(0, 1) } },
      select: { lexeme: true, acceptedAnswers: true },
    })
    lex = candidates.find(c => strip(c.lexeme) === stripped) ?? null
  }
  if (!lex?.acceptedAnswers) return []
  return lex.acceptedAnswers.split(',').map(s => s.trim()).filter(Boolean)
}

export async function gradeResponse(
  questionId: string,
  studentAnswer: string,
  /** Pass this from the caller when you already have the assignment loaded — avoids an extra DB query per question. */
  provideDefinitionOverride?: boolean
): Promise<{ isCorrect: boolean; score: number; correctAnswer: string }> {
  const question = await prisma.question.findUnique({ where: { id: questionId } })
  if (!question) throw new Error('Question not found')

  let isCorrect = false

  if (question.type === 'TRANSLATION' || question.type === 'SYNTAX_IDENTIFY') {
    // Manual grading — mark pending
    return { isCorrect: false, score: 0, correctAnswer: question.correctAnswer }
  }

  if (question.type === 'MORPHOLOGY_IDENTIFY') {
    try {
      const correct = JSON.parse(question.correctAnswer)
      const student = JSON.parse(studentAnswer)
      const fields = Object.keys(correct).filter(k => correct[k])
      // Guard against malformed questions with no gradable fields (avoids 0/0 = NaN score)
      if (fields.length === 0) {
        return { isCorrect: false, score: 0, correctAnswer: question.correctAnswer }
      }
      const matched = fields.filter(k => student[k]?.toLowerCase() === correct[k]?.toLowerCase())
      const score = (matched.length / fields.length) * question.points
      isCorrect = matched.length === fields.length
      return { isCorrect, score, correctAnswer: question.correctAnswer }
    } catch {
      return { isCorrect: false, score: 0, correctAnswer: question.correctAnswer }
    }
  }

  // Multiple-choice: the student picked a whole option, so match the full string.
  // (Never comma-split — a single gloss like "hope, expectation" is one option.)
  if (question.type === 'MULTIPLE_CHOICE') {
    isCorrect = isMultipleChoiceCorrect(studentAnswer, question.correctAnswer)
    return { isCorrect, score: isCorrect ? question.points : 0, correctAnswer: question.correctAnswer }
  }

  // Typed answers: accept comma-separated alternatives, with optional fuzzy matching.
  // Use override if supplied (avoids N+1 when grading a whole quiz at once)
  let fuzzy: boolean
  if (provideDefinitionOverride !== undefined) {
    fuzzy = provideDefinitionOverride
  } else {
    const assignment = await prisma.assignment.findUnique({
      where: { id: question.assignmentId },
      select: { provideDefinition: true },
    })
    fuzzy = assignment?.provideDefinition ?? false
  }

  // For Greek → English typed answers, augment the correctAnswer with the lemma's
  // curated synonyms (the new acceptedAnswers field). This way the grader honours
  // instructor-approved alternatives like "preach" for κηρύσσω. Only applies to
  // typed answers; not to ENGLISH_TO_GREEK (different problem) or MULTIPLE_CHOICE.
  let acceptable = question.correctAnswer
  if (question.type === 'GREEK_TO_ENGLISH') {
    const synonyms = await getLemmaSynonyms(question.prompt)
    if (synonyms.length > 0) {
      acceptable = [question.correctAnswer, ...synonyms].join(',')
    }
  }

  isCorrect = isAnswerCorrect(studentAnswer, acceptable, fuzzy)
  return {
    isCorrect,
    score: isCorrect ? question.points : 0,
    correctAnswer: question.correctAnswer,
  }
}

// Re-exported for backwards compatibility with existing importers.
export { fuzzyMatch, normalise }

export async function getAssignmentScore(userId: string, assignmentId: string) {
  const responses = await prisma.response.findMany({
    where: { userId, assignmentId, questionId: { not: null } },
  })

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { questions: true },
  })
  if (!assignment) return null

  const totalPoints = assignment.questions.reduce((s, q) => s + q.points, 0)
  const earned = responses.reduce((s, r) => s + (r.score ?? 0), 0)

  return {
    earned,
    total: totalPoints,
    percentage: totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0,
  }
}

export function getAutoGradableTypes(): QuestionType[] {
  return ['GREEK_TO_ENGLISH', 'ENGLISH_TO_GREEK', 'MULTIPLE_CHOICE', 'MATCHING', 'MORPHOLOGY_IDENTIFY']
}
