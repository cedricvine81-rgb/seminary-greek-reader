import type { LexicalInfoPanel } from '@/types/lexicon'

// Lets the Master Search side panel feed word parses into the HOST page's parsing pane
// (bottom-left in the Reader) instead of stacking its own dock inside the panel — in the
// split view the reader's pane is already on screen, so one pane serves both surfaces.
// The reader registers a sink while mounted; the panel's Greek results emit into it when
// embedded. No sink registered (full /search page, or a host page without a parsing pane)
// → the search keeps its own internal ParsingDock.

type ParsingSink = (info: LexicalInfoPanel | null) => void
let _sink: ParsingSink | null = null

export function registerParsingSink(fn: ParsingSink | null): void { _sink = fn }
export function hasParsingSink(): boolean { return _sink != null }
export function emitParsingInfo(info: LexicalInfoPanel | null): void { _sink?.(info) }
