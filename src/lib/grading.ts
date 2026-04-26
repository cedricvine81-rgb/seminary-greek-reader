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

  isCorrect = normalise(studentAnswer) === normalise(question.correctAnswer)
  return {
    isCorrect,
    score: isCorrect ? question.points : 0,
    correctAnswer: question.correctAnswer,
  }
}

function normalise(s: string) {
  return s.trim().toLowerCase().replace(/[.,;:!?]/g, '')
}

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
