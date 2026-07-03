// Highlighter palette — literal Tailwind classes (kept for the JIT compiler) applied as
// a <mark> background over selected text. Yellow is the default, matching a real highlighter.
export const HIGHLIGHT_COLORS = {
  yellow: { label: 'Yellow', swatch: 'bg-yellow-300', mark: 'bg-yellow-200' },
  green:  { label: 'Green',  swatch: 'bg-green-300',  mark: 'bg-green-200' },
  blue:   { label: 'Blue',   swatch: 'bg-blue-300',   mark: 'bg-blue-200' },
  pink:   { label: 'Pink',   swatch: 'bg-pink-300',   mark: 'bg-pink-200' },
  purple: { label: 'Purple', swatch: 'bg-purple-300', mark: 'bg-purple-200' },
} as const

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS
export const HIGHLIGHT_COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = 'yellow'

export const highlightMarkClass = (c?: string | null): string =>
  HIGHLIGHT_COLORS[(c as HighlightColor) in HIGHLIGHT_COLORS ? (c as HighlightColor) : DEFAULT_HIGHLIGHT_COLOR].mark
