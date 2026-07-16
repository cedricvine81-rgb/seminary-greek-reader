// MT = the Hebrew Masoretic Old Testament (public/data/mt, from OSHB/MorphHB).
export type Corpus = 'LXX' | 'GNT' | 'NA1904' | 'MT'

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
  // Hebrew (MT) morphology, present only for the Masoretic corpus. The chapter files already
  // ship these per word (built by scripts/build-hebrew-ot.py), so the client decodes the parse
  // and looks up the Strong's gloss on demand (see src/components/reader/HebrewWord.tsx).
  strongs?: string       // Strong's Hebrew number, no prefix (e.g. "430")
  morph?: string         // raw OSHB morphology code (e.g. "Ncmpa")
  lang?: 'H' | 'A'       // Hebrew or Aramaic (absent = Hebrew)
  morphemes?: HebrewMorpheme[]
  after?: string         // trailing connector before the next word ('־' maqqef; absent = space)
}

export interface HebrewMorpheme {
  text: string
  strongs: string
  morph: string
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
