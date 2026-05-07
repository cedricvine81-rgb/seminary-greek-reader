export type Corpus = 'LXX' | 'GNT' | 'NA1904'

export interface BiblicalBook {
  id: string
  corpus: Corpus
  osisId: string
  name: string
  abbrev: string
  totalChapters: number
}

export interface BiblicalVerse {
  id: string
  bookId: string
  chapter: number
  verse: number
  reference: string
  text: string
  words?: VerseWord[]
}

export interface VerseWord {
  id: string
  verseId: string
  position: number
  surface: string
  lexemeId?: string
  lexeme?: import('./lexicon').LexicalEntry
  parses?: import('./morphology').MorphParse[]
}

export interface ReaderState {
  corpus: Corpus
  book: BiblicalBook | null
  chapter: number
  verses: BiblicalVerse[]
  selectedWord: VerseWord | null
  searchQuery: string
  searchCorpus: Corpus | 'BOTH'
  isLoading: boolean
}

export interface NavigationTarget {
  corpus: Corpus
  osisId: string
  chapter: number
  verse?: number
}
