export type FrequencyLevel = 'BEGINNING' | 'INTERMEDIATE'

export interface Flashcard {
  id: string
  lexemeId: string
  level: FrequencyLevel
  front: string
  backLexeme: string
  backGloss: string
  backParsing?: string
}

export interface FlashcardProgress {
  id: string
  userId: string
  flashcardId: string
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: string
  lastReviewDate?: string
  knownCount: number
  unknownCount: number
}

export interface FlashcardWithProgress extends Flashcard {
  progress?: FlashcardProgress
}

export type FlashcardResponse = 'KNOW' | 'DONT_KNOW'

export interface DeckSession {
  level: FrequencyLevel
  cards: FlashcardWithProgress[]
  currentIndex: number
  isFlipped: boolean
  sessionStats: { known: number; unknown: number }
}
