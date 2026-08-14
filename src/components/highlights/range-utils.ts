/**
 * DOM range ↔ character offset helpers, shared by every surface that turns a drag-selection
 * into a persisted range: the verse highlighter (useHighlightSelection) and the block
 * annotator (annotations/useBlockSelection).
 *
 * They live here rather than in either hook because a second copy is how the reference
 * parsers drifted — a fix landed in one and not the other, and nothing failed loudly.
 */

/**
 * Character offset of `point` within `container`'s concatenated text content — the standard
 * DOM trick (a Range from the container's start to the point, measured as a string) which
 * works whether the container is one text node or many nested spans (per-word Greek tokens,
 * a `<Gk>` inside a paragraph), so it needs no per-view special-casing.
 */
export function offsetWithin(container: Node, point: Node, pointOffset: number): number {
  const r = document.createRange()
  r.selectNodeContents(container)
  r.setEnd(point, pointOffset)
  return r.toString().length
}

/**
 * Clip `range` to fall entirely within `el`, so a selection spanning several anchors can be
 * split into one sub-range per anchor. Returns null when nothing of the range is inside.
 */
export function clipRangeToElement(range: Range, el: HTMLElement): Range | null {
  const elRange = document.createRange()
  elRange.selectNodeContents(el)
  const clipped = range.cloneRange()
  if (range.compareBoundaryPoints(Range.START_TO_START, elRange) < 0) clipped.setStart(el, 0)
  if (range.compareBoundaryPoints(Range.END_TO_END, elRange) > 0) clipped.setEnd(el, el.childNodes.length)
  return clipped.collapsed ? null : clipped
}

/**
 * The inverse of `offsetWithin`: build a live Range covering [start, end) of `el`'s text.
 *
 * Walks the text nodes in document order, which is what makes a stored offset survive the
 * markup around it — the same range is rebuilt whether the words sit in one text node or are
 * broken up by a `<Gk>`, a `<strong>` and a glossary `<Term>` button.
 *
 * Returns null if the element is shorter than the offsets ask for, which is exactly what
 * happens when a block has been edited: the caller re-anchors instead of guessing.
 */
export function rangeFromOffsets(el: HTMLElement, start: number, end: number): Range | null {
  if (end <= start) return null
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let seen = 0
  let range: Range | null = null
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const len = node.nodeValue?.length ?? 0
    const nodeStart = seen
    const nodeEnd = seen + len
    if (!range && start >= nodeStart && start <= nodeEnd) {
      range = document.createRange()
      range.setStart(node, start - nodeStart)
    }
    if (range && end >= nodeStart && end <= nodeEnd) {
      range.setEnd(node, end - nodeStart)
      return range
    }
    seen = nodeEnd
  }
  return null
}
