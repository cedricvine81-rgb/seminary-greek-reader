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
  /** Curated synonyms accepted as correct, from the lemma's lexicon entry.
   *  Used by the client's instant feedback to agree with the server's grader. */
  acceptedAnswers?: string[]
}

export interface QuizResult {
  assignmentId: string
  totalQuestions: number
  correctAnswers: number
  score: number
  percentage: number
  breakdown: QuizResultItem[]
  isNewBest?: boolean
  /** A practice run: graded by the same rules, recorded nowhere. */
  practice?: boolean
  attemptNumber?: number
  retakesRemaining?: number | null
}

export interface QuizResultItem {
  questionId: string
  prompt: string
  yourAnswer: string
  correctAnswer: string
  isCorrect: boolean
  points: number
  /** ID of the Response row this graded result corresponds to. Used to anchor appeals. */
  responseId?: string
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
