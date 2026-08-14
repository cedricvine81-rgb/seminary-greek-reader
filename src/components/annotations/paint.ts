import { rangeFromOffsets } from '@/components/highlights/range-utils'
import { HIGHLIGHT_COLOR_KEYS } from '@/lib/highlight-colors'

/**
 * Painting annotations with the CSS Custom Highlight API rather than by wrapping the text
 * in <mark> elements.
 *
 * The Grammar prose is not a string — it is a React tree with `<Gk>`, `<strong>` and
 * glossary `<Term>` buttons threaded through it, and a translated block is rebuilt from a
 * template on every language change. Wrapping a highlight would mean splitting that tree
 * (or mutating DOM that React owns and will happily discard on its next render). Custom
 * highlights paint a live Range without touching either, so a highlight can start inside a
 * Greek span and end in the plain text after it, and nothing in the chapter has to know.
 *
 * The trade-off is that a painted range is not an element, so it cannot be hovered or
 * clicked directly — see hitTest below. Where the API is missing the page degrades to the
 * margin markers, which is the only affordance that has to work for a note to be findable.
 */

type HighlightRegistry = { set(name: string, h: unknown): void; delete(name: string): void }
type HighlightCtor = new (...ranges: Range[]) => unknown

function registry(): HighlightRegistry | null {
  const css = (globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS
  return css?.highlights ?? null
}

export const canPaint = (): boolean =>
  registry() !== null && typeof (globalThis as { Highlight?: HighlightCtor }).Highlight === 'function'

/** Highlight-registry names are global to the document, so they carry the surface prefix. */
const nameFor = (color: string, withNote: boolean) => `ann-${color}${withNote ? '-note' : ''}`

export interface PaintRange { color: string; withNote: boolean; start: number; end: number; block: HTMLElement }

/**
 * Register every range with the document, grouped by the style it should get. Called after
 * each resolve pass; replaces the previous registration wholesale rather than diffing,
 * because a resolve pass is cheap and a stale half-cleared group would paint a lie.
 */
export function paint(ranges: PaintRange[]): void {
  const reg = registry()
  if (!reg) return
  const Ctor = (globalThis as { Highlight?: HighlightCtor }).Highlight
  if (!Ctor) return

  const groups = new Map<string, Range[]>()
  for (const r of ranges) {
    const live = rangeFromOffsets(r.block, r.start, r.end)
    if (!live) continue
    const key = nameFor(r.color, r.withNote)
    const list = groups.get(key)
    if (list) list.push(live)
    else groups.set(key, [live])
  }

  for (const color of HIGHLIGHT_COLOR_KEYS) {
    for (const withNote of [false, true]) {
      const key = nameFor(color, withNote)
      const list = groups.get(key)
      if (list && list.length) reg.set(key, new Ctor(...list))
      else reg.delete(key)
    }
  }
}

/** Clear every group this module owns — on unmount, and when leaving a chapter. */
export function unpaint(): void {
  const reg = registry()
  if (!reg) return
  for (const color of HIGHLIGHT_COLOR_KEYS) {
    reg.delete(nameFor(color, false))
    reg.delete(nameFor(color, true))
  }
}

/**
 * Which painted range, if any, is under the pointer.
 *
 * A custom highlight has no element to hit-test, so we go the other way: find the text
 * position under the cursor and ask which stored range contains it. `caretPositionFromPoint`
 * is the standard; WebKit and Blink shipped `caretRangeFromPoint` first and still carry it.
 */
export function caretOffsetAt(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }
  const pos = doc.caretPositionFromPoint?.(x, y)
  if (pos) return { node: pos.offsetNode, offset: pos.offset }
  const range = doc.caretRangeFromPoint?.(x, y)
  return range ? { node: range.startContainer, offset: range.startOffset } : null
}
