// Lets Grammar-page exercise blocks open the Translation Workbench side panel
// (same open-a-pane mechanism as the Master Search / word-search buses). The
// panel is hosted once by <TranslationWorkbench /> inside MorphologyView.

/** One word of a workbench sentence, with its model answers. */
export interface WorkbenchWord {
  /** Surface form as it appears in the sentence. */
  w: string
  /** Model parsing, e.g. "Pres Act Ind 1 Pl — πιστεύω" or "Acc Sg Fem — ἀγάπη". */
  parsing?: string
  /** Model syntax category (a value from ALL_SYNTAX_OPTIONS); omit where none applies. */
  syntax?: string
  /** Model word-level translation ("gloss"). */
  gloss?: string
}

export interface WorkbenchSentence {
  /** Where the sentence comes from, e.g. "Lesson 3 · Prepositions". */
  lesson?: string
  words: WorkbenchWord[]
  /** Model translation of the whole sentence. */
  translation: string
  /** Optional pedagogical note revealed with the model translation. */
  note?: string
}

let handler: ((s: WorkbenchSentence) => void) | null = null

export function registerTranslationWorkbench(h: ((s: WorkbenchSentence) => void) | null) {
  handler = h
}

export function openTranslationWorkbench(s: WorkbenchSentence) {
  handler?.(s)
}
