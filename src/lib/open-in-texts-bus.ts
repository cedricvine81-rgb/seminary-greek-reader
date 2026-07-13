import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'

// A minimal event bus so the app-wide background-sources search modal can hand a hit off to
// the Exegesis Texts reader when the workspace is already mounted (same-page, in-place),
// and fall back to URL navigation (/exegesis?tab=texts&open=…) when it isn't. ExegesisTabs
// subscribes while mounted.
type Listener = (t: OpenInTextsTarget) => void
const listeners = new Set<Listener>()

export function onOpenInTexts(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
export function emitOpenInTexts(t: OpenInTextsTarget): void {
  listeners.forEach(fn => fn(t))
}
export function hasOpenInTextsListener(): boolean {
  return listeners.size > 0
}
