// Lets any page open an embedded prose passage (Theon, Quintilian, …) in the app-wide
// side panel hosted by ProsePanelProvider in the root layout — the same split-view
// treatment the Master Search panel gets, so a cited source can be read beside the page
// that cited it instead of navigating away.
//
// Used by the Synopsis tab's techniques key: its Theon / Quintilian citations open the
// actual text here rather than sending the student to an external site.

export interface ProsePassageTarget {
  /** EmbeddedProseSource, e.g. 'theon-progymnasmata' or 'quintilian-10'. */
  source: string
  chapter: number
  /** Paragraph to scroll to and mark, when the chapter holds more than one. */
  verse?: number
  /** Heading for the panel; falls back to the work's registered name. */
  label?: string
  /** The precise section being cited ("10.5.4–11"), shown under the heading — chapters
   *  are stored as whole blocks, so this is finer than anything we can scroll to. */
  cite?: string
}

type OpenFn = (t: ProsePassageTarget) => void
let _opener: OpenFn | null = null

export function registerProsePanel(fn: OpenFn | null): void { _opener = fn }
export function openProsePassage(t: ProsePassageTarget): void { _opener?.(t) }
export function hasProsePanel(): boolean { return _opener != null }
