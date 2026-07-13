// Lets any reading pane (Reader translation column, Notes/Commentary/Texts text panes) open
// the shared "search this word" popover — the search half of the Reader's right-click menu,
// no syntax — hosted once by WordSearchProvider in the root layout.
export interface WordSearchPayload {
  x: number
  y: number
  surface: string
  lemma?: string | null
  reference?: string | null           // e.g. "Matt 5:44", for the Copy row
  kind: 'greek' | 'translation'
  greekCorpus?: 'GNT' | 'LXX'         // default scope for Greek words
  transLang?: string                  // language code for translation words (en, es, …)
}
type OpenFn = (payload: WordSearchPayload) => void
let _opener: OpenFn | null = null

export function registerWordSearch(fn: OpenFn | null): void { _opener = fn }
export function openWordSearch(payload: WordSearchPayload): void { _opener?.(payload) }
export function hasWordSearch(): boolean { return _opener != null }
