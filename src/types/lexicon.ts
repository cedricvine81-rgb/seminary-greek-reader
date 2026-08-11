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
  /**
   * For a PREPOSITION: the case of the phrase it governs, read from the following words.
   * A preposition carries no case of its own, and in Greek its meaning often depends entirely
   * on the case of its object — διά + genitive is "by means of", διά + accusative "because of".
   * Supplied by the caller, which can see the neighbouring words; the panel cannot.
   */
  objectCase?: string
  // Hebrew (MT) enrichment — set only for Masoretic words so the parsing pane renders in the
  // Hebrew font, shows the transliteration + full definition, and lists prefix/suffix segments.
  script?: 'hebrew'
  transliteration?: string
  definition?: string       // Strong's concise definition
  bdbDefinition?: string    // Brown-Driver-Briggs entry (fuller, shown in the Hebrew word menu)
  segments?: HebrewSegment[]
}

export interface HebrewSegment {
  text: string    // the morpheme's surface (e.g. the prefixed בְּ)
  label: string   // its role (e.g. "preposition", "definite article", "3ms suffix")
  gloss?: string  // dictionary gloss, when the morpheme has a Strong's entry
}
