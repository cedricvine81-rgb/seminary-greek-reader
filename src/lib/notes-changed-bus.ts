// Fires whenever a verse note is created/edited/deleted anywhere (the note icons on the
// Reader, Texts, Commentary and Notes panes). Lets the Notes notebook — which stays mounted
// across the Exegesis tabs and would otherwise hold a stale list — reload when a note is made
// on another tab.
type Listener = () => void
const listeners = new Set<Listener>()

export function onNotesChanged(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function emitNotesChanged(): void {
  listeners.forEach(fn => { try { fn() } catch { /* ignore */ } })
}
