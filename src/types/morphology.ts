export interface MorphParse {
  id: string
  wordId: string
  lexemeId: string
  surface: string
  partOfSpeech: string
  casus?: string
  number?: string
  gender?: string
  tense?: string
  voice?: string
  mood?: string
  person?: string
  degree?: string
  extraInfo?: string
}

export interface MorphOptions {
  partOfSpeech: string[]
  case: string[]
  number: string[]
  gender: string[]
  tense: string[]
  voice: string[]
  mood: string[]
  person: string[]
  participleType: string[]
  infinitiveType: string[]
  pronounType: string[]
  articleUsage: string[]
  prepositionFunction: string[]
}

export type MorphField =
  | 'partOfSpeech' | 'case' | 'number' | 'gender'
  | 'tense' | 'voice' | 'mood' | 'person'
  | 'participleType' | 'infinitiveType'
  | 'pronounType' | 'articleUsage' | 'prepositionFunction'

export interface MorphAnswer {
  field: MorphField
  value: string
}
