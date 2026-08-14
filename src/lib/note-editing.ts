/**
 * Global signal for "the reader is writing a note right now" — the same shape as
 * exam-lockdown's, and read by NativeMenuGuard.
 *
 * WHY. Writing with an Apple Pencil means resting a hand on the glass, and a resting palm is
 * a long press, and a long press is a `contextmenu` — so the app's word menu kept firing over
 * the note the reader was in the middle of writing. There is no way to tell a palm from a
 * deliberate press, so the rule is contextual instead: while a note is open, a NON-MOUSE
 * context menu is assumed to be the hand and is swallowed. A right-click from an actual mouse
 * still works, on a tablet as much as on a desktop.
 *
 * Ref-counted rather than boolean: several composers can be mounted at once (the notebook
 * beside a verse note), and the last one closing must not clear a flag the first still needs.
 */
let _open = 0

export function setNoteEditing(on: boolean): void {
  _open = Math.max(0, _open + (on ? 1 : -1))
}

export function isNoteEditing(): boolean {
  return _open > 0
}
