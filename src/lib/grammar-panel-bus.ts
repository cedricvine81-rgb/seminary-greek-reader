// Lets the Reader's right-click syntax menu open the Grammar beside the text instead of
// navigating to /grammar — so a student who wants to know what "Genitive of Apposition"
// means can read the chapter without losing the verse they were reading.
//
// Same shape as master-search-bus.ts and page-guide-bus.ts; the panel is hosted once by
// GrammarPanelProvider in the root layout.

export interface GrammarPanelTarget {
  /** MorphologyView MainTab id, e.g. 'nouns'. */
  chapter: string
  /** Which explanation register to open at. */
  level: 'beginning' | 'intermediate'
  /** The syntax category that sent us here, shown as context in the panel header. */
  fromCategory?: string
}

type OpenFn = (target: GrammarPanelTarget) => void
let _opener: OpenFn | null = null

export function registerGrammarPanel(fn: OpenFn | null): void { _opener = fn }
export function openGrammarPanel(target: GrammarPanelTarget): void { _opener?.(target) }
/** False when no provider is mounted — callers fall back to navigating. */
export function hasGrammarPanel(): boolean { return _opener != null }
