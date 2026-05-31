import { prisma } from './db'
import type { QuestionType } from '@/types/assignment'

export async function gradeResponse(
  questionId: string,
  studentAnswer: string
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
      const matched = fields.filter(k => student[k]?.toLowerCase() === correct[k]?.toLowerCase())
      const score = (matched.length / fields.length) * question.points
      isCorrect = matched.length === fields.length
      return { isCorrect, score, correctAnswer: question.correctAnswer }
    } catch {
      return { isCorrect: false, score: 0, correctAnswer: question.correctAnswer }
    }
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: question.assignmentId },
    select: { provideDefinition: true },
  })
  const fuzzy = assignment?.provideDefinition ?? false
  isCorrect = acceptsAnswer(studentAnswer, question.correctAnswer, fuzzy)
  return {
    isCorrect,
    score: isCorrect ? question.points : 0,
    correctAnswer: question.correctAnswer,
  }
}

function normalise(s: string) {
  return s.trim().toLowerCase().replace(/[.,;:!?]/g, '').trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function fuzzyMatch(student: string, expected: string): boolean {
  if (student === expected) return true
  const maxLen = Math.max(student.length, expected.length)
  if (maxLen === 0) return true
  const allowed = maxLen <= 3 ? 0 : maxLen <= 6 ? 1 : 2
  return levenshtein(student, expected) <= allowed
}

// Accept any comma-separated alternative in the correct answer (mirrors client logic).
function acceptsAnswer(studentAnswer: string, correctAnswer: string, fuzzy = false): boolean {
  const student = normalise(studentAnswer)
  if (!student) return false
  const alts = correctAnswer.split(',').map(a => normalise(a))
  return fuzzy
    ? alts.some(alt => fuzzyMatch(student, alt))
    : alts.some(alt => alt === student)
}

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
