export interface LexicalEntry {
  id: string
  lexeme: string
  strongs?: string
  gloss: string
  extendedGloss?: string
  partOfSpeech: string
  frequency: number
}

export interface LexicalInfoPanel {
  surface: string
  lexeme: string
  gloss: string
  extendedGloss?: string
  partOfSpeech: string
  parsing: string
  strongs?: string
  reference: string
}
