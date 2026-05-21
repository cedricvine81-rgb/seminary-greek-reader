import type { QuestionType } from './assignment'

export interface QuizSession {
  assignmentId: string
  questions: QuizQuestion[]
  currentIndex: number
  answers: Record<string, string>
  startedAt: string
  submittedAt?: string
}

export interface QuizQuestion {
  id: string
  position: number
  type: QuestionType
  prompt: string
  correctAnswer: string
  options?: string[]
  points: number
  reference?: string
}

export interface QuizResult {
  assignmentId: string
  totalQuestions: number
  correctAnswers: number
  score: number
  percentage: number
  breakdown: QuizResultItem[]
}

export interface QuizResultItem {
  questionId: string
  prompt: string
  yourAnswer: string
  correctAnswer: string
  isCorrect: boolean
  points: number
}

export interface ProgressStats {
  totalAssignments: number
  completedAssignments: number
  averageScore: number
  accuracyByType: Record<QuestionType, number>
  recentActivity: RecentActivityItem[]
}

export interface RecentActivityItem {
  assignmentId: string
  assignmentTitle: string
  completedAt: string
  score: number
  percentage: number
}
