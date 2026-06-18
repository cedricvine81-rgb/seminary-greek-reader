import type { CourseLevel } from './course'

export type AssignmentType = 'VOCABULARY_QUIZ' | 'PASSAGE_VOCABULARY' | 'MORPHOLOGY_QUIZ' | 'TRANSLATION_EXERCISE' | 'TRANSLATION_EXAM'

export type QuestionType =
  | 'GREEK_TO_ENGLISH'
  | 'ENGLISH_TO_GREEK'
  | 'MULTIPLE_CHOICE'
  | 'MATCHING'
  | 'MORPHOLOGY_IDENTIFY'
  | 'TRANSLATION'
  | 'SYNTAX_IDENTIFY'

export interface Assignment {
  id: string
  courseId: string
  createdById: string
  title: string
  type: AssignmentType
  weekNumber: number
  dueDate: string
  level: CourseLevel
  reference?: string
  instructions?: string
  timePerQuestion?: number | null
  round1Deadline?: string | null   // ISO; translation exercises
  round2Deadline?: string | null   // ISO; translation exercises
  allowLate: boolean
  lateDaysLimit?: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  questions?: Question[]
  _count?: { questions: number; responses: number }
}

export interface Question {
  id: string
  assignmentId: string
  position: number
  type: QuestionType
  prompt: string
  correctAnswer: string
  options: string[]
  points: number
  reference?: string
}

export interface Response {
  id: string
  userId: string
  assignmentId: string
  questionId?: string
  answer: string
  isCorrect?: boolean
  score?: number
  submittedAt: string
}

export interface AssignmentFormData {
  title: string
  type: AssignmentType
  weekNumber: number
  dueDate: string
  level: CourseLevel
  reference?: string
  instructions?: string
  numQuestions: number
  timePerQuestion?: number
  reviewTimeSeconds?: number
  submissionDeadline?: string   // datetime-local string; translation exercises
  round1Deadline?: string   // datetime-local string; translation exercises
  round2Deadline?: string   // datetime-local string; translation exercises
  allowReaderInRound2?: boolean   // translation exercises: expose Reader info during Round 2
  glossFrequency?: number | null  // translation exercises: glossary frequency threshold (null/undefined = off)
  allowLate?: boolean
  lateDaysLimit?: number
}
