// Highlighter palette. `swatch` (a Tailwind class, kept for the JIT compiler) colours the
// picker dots; the applied marker style lives in globals.css as `.hl-mark` + `.hl-<colour>`,
// so restyling every pane's highlights is one change there. Yellow is the default.
export const HIGHLIGHT_COLORS = {
  yellow: { label: 'Yellow', swatch: 'bg-yellow-300' },
  green:  { label: 'Green',  swatch: 'bg-green-300' },
  blue:   { label: 'Blue',   swatch: 'bg-blue-300' },
  pink:   { label: 'Pink',   swatch: 'bg-pink-300' },
  purple: { label: 'Purple', swatch: 'bg-purple-300' },
  grey:   { label: 'Light grey', swatch: 'bg-neutral-300' },
} as const

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS
export const HIGHLIGHT_COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = 'yellow'

// Classes for a highlighted run: the shared `.hl-mark` marker style plus the per-colour class
// that sets its `--hl-ink` (both defined in globals.css).
export const highlightMarkClass = (c?: string | null): string => {
  const key = (c as HighlightColor) in HIGHLIGHT_COLORS ? (c as HighlightColor) : DEFAULT_HIGHLIGHT_COLOR
  return `hl-mark hl-${key}`
}
