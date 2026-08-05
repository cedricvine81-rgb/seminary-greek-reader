import type { HighlightColor } from '@/lib/highlight-colors'

// Highlight controls for the right-clicked word — supplied by the pane (which owns the
// offsets + its useHighlights instance). Present only for Greek words in panes that support
// highlighting. Shown as a swatch row at the top of the word menu.
export interface WordHighlight {
  activeColor: string | null           // color of an existing highlight on this word, or null
  onPick: (color: HighlightColor) => void
  onRemove: () => void
}

// Lets any reading pane (Reader translation column, Notes/Commentary/Texts text panes) open
// the shared "search this word" popover — the search half of the Reader's right-click menu,
// no syntax — hosted once by WordSearchProvider in the root layout.
export interface WordSearchPayload {
  x: number
  y: number
  surface: string
  lemma?: string | null
  reference?: string | null           // e.g. "Matt 5:44", for the Copy row
  // 'hebrew' is for Hebrew/Aramaic script words — the Bavli and Tosefta in the Texts reader.
  // Its menu is deliberately short: those works are in no search facet (they have no English,
  // and the grc facet excludes Hebrew script), so the only corpus a word from them can be
  // searched against is the Hebrew Bible. Offering a collection search would return nothing.
  kind: 'greek' | 'translation' | 'hebrew'
  greekCorpus?: 'GNT' | 'LXX'         // default scope for Greek words
  transLang?: string                  // language code for translation words (en, es, …)
  book?: string                       // current book's osisId — enables the "this book" scope
  // Set when the word lives in a background/Texts work (Philo, Josephus, Epictetus, …). The word
  // isn't in a Bible book, so the menu searches the background collection (bg:<category>) instead
  // of a Bible translation — otherwise "this book" scopes the WEB Bible to a non-existent book.
  bgCollection?: string               // catalog category id, e.g. 'philo'
  bgCollectionLabel?: string          // human label for the menu, e.g. 'Philo'
  highlight?: WordHighlight           // when set, a highlighter swatch row shows at the top
}
type OpenFn = (payload: WordSearchPayload) => void
let _opener: OpenFn | null = null

export function registerWordSearch(fn: OpenFn | null): void { _opener = fn }
export function openWordSearch(payload: WordSearchPayload): void { _opener?.(payload) }
export function hasWordSearch(): boolean { return _opener != null }
