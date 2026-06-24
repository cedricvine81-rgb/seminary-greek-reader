// Folder colour palette — keyed values with full literal Tailwind classes (so the
// JIT compiler keeps them). Matches the site: brand blues plus warm yellows.
export const NOTE_COLORS = {
  blue:   { label: 'Blue',   dot: 'bg-blue-500',   chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  sky:    { label: 'Sky',    dot: 'bg-sky-500',    chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  indigo: { label: 'Indigo', dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  amber:  { label: 'Amber',  dot: 'bg-amber-500',  chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  yellow: { label: 'Yellow', dot: 'bg-yellow-400', chip: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  slate:  { label: 'Slate',  dot: 'bg-slate-500',  chip: 'bg-slate-100 text-slate-700 border-slate-200' },
} as const

export type NoteColor = keyof typeof NOTE_COLORS
export const NOTE_COLOR_KEYS = Object.keys(NOTE_COLORS) as NoteColor[]
export const colorOf = (c?: string | null): (typeof NOTE_COLORS)[NoteColor] =>
  NOTE_COLORS[(c as NoteColor) in NOTE_COLORS ? (c as NoteColor) : 'blue']
