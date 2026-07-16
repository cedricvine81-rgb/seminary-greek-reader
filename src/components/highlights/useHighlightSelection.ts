import { useEffect, useState, type RefObject } from 'react'

export interface HighlightSplit { book: string; chapter: number; verse: number; start: number; end: number; layer: string }

export type HighlightPopupState =
  | { kind: 'new'; x: number; y: number; splits: HighlightSplit[] }
  | { kind: 'edit'; x: number; y: number; id: string; book: string; chapter: number; color: string }

// Character offset of `point` within `container`'s concatenated text content — the
// standard DOM trick (a Range from the container's start to the point, measured as a
// string) which works whether the container is one text node or many nested spans
// (e.g. per-word Greek token spans), so it needs no per-view special-casing.
function offsetWithin(container: Node, point: Node, pointOffset: number): number {
  const r = document.createRange()
  r.selectNodeContents(container)
  r.setEnd(point, pointOffset)
  return r.toString().length
}

// Clip `range` to fall entirely within `el` (a single verse's anchor element), so a
// selection spanning several verses can be split into one sub-range per verse.
function clipRangeToElement(range: Range, el: HTMLElement): Range | null {
  const elRange = document.createRange()
  elRange.selectNodeContents(el)
  const clipped = range.cloneRange()
  if (range.compareBoundaryPoints(Range.START_TO_START, elRange) < 0) clipped.setStart(el, 0)
  if (range.compareBoundaryPoints(Range.END_TO_END, elRange) > 0) clipped.setEnd(el, el.childNodes.length)
  return clipped.collapsed ? null : clipped
}

/**
 * Captures drag-selections within `containerRef` and turns them into per-verse character
 * offsets, ready to persist as highlights. Every verse to be covered must render with
 * `data-hl-book`, `data-hl-chapter`, `data-hl-verse` on its own wrapper element so the
 * selection can be split at verse boundaries and measured relative to each verse's own
 * text — this is the only integration requirement for a reading surface to support
 * highlighting; click-to-parse and other per-token interactions are untouched.
 */
export function useHighlightSelection(containerRef: RefObject<HTMLElement | null>) {
  const [popup, setPopup] = useState<HighlightPopupState | null>(null)

  useEffect(() => {
    function onMouseUp(e: MouseEvent) {
      // Only a left-button drag-selection opens the highlight palette. Right-click
      // (button 2) leaves the word selected but must NOT pop the palette — that word's
      // right-click menu already carries its own Highlight row.
      if (e.button !== 0) return
      const container = containerRef.current
      if (!container) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return

      const anchors = Array.from(container.querySelectorAll<HTMLElement>('[data-hl-verse]'))
        .filter(el => range.intersectsNode(el))
      if (anchors.length === 0) return

      const splits: HighlightSplit[] = []
      for (const el of anchors) {
        const clipped = clipRangeToElement(range, el)
        if (!clipped) continue
        const start = offsetWithin(el, clipped.startContainer, clipped.startOffset)
        const end = offsetWithin(el, clipped.endContainer, clipped.endOffset)
        if (end <= start) continue
        splits.push({ book: el.dataset.hlBook!, chapter: Number(el.dataset.hlChapter), verse: Number(el.dataset.hlVerse), start, end, layer: el.dataset.hlLayer ?? 'grc' })
      }
      if (splits.length === 0) return

      const rect = range.getBoundingClientRect()
      setPopup({ kind: 'new', x: rect.left + rect.width / 2, y: rect.top, splits })
    }

    // Click-to-edit an existing highlight — only when the click didn't just create (or
    // leave open) a text selection, so it never fights with the drag-to-highlight path.
    function onClick(e: MouseEvent) {
      const container = containerRef.current
      if (!container) return
      const mark = (e.target as HTMLElement).closest<HTMLElement>('[data-highlight-id]')
      if (!mark || !container.contains(mark)) return
      if (!window.getSelection()?.isCollapsed) return
      const rect = mark.getBoundingClientRect()
      setPopup({
        kind: 'edit', x: rect.left + rect.width / 2, y: rect.top,
        id: mark.dataset.highlightId!, book: mark.dataset.hlBook!, chapter: Number(mark.dataset.hlChapter), color: mark.dataset.hlColor!,
      })
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('click', onClick)
    return () => { document.removeEventListener('mouseup', onMouseUp); document.removeEventListener('click', onClick) }
  }, [containerRef])

  function close() { setPopup(null); window.getSelection()?.removeAllRanges() }

  return { popup, close }
}
