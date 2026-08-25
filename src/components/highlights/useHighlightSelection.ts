import { useEffect, useRef, useState, type RefObject } from 'react'
import { offsetWithin, clipRangeToElement } from './range-utils'

export interface HighlightSplit { book: string; chapter: number; verse: number; start: number; end: number; layer: string }

export type HighlightPopupState =
  | { kind: 'new'; x: number; y: number; splits: HighlightSplit[]; text: string }
  | { kind: 'edit'; x: number; y: number; id: string; book: string; chapter: number; color: string; text: string }

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
  // Which selection the palette is currently for, so a settling touch selection doesn't
  // reopen it on every adjustment.
  const shownFor = useRef<string | null>(null)

  /** Range → per-verse splits → palette. The shared tail of every path in: the mouse
   *  drag-selection below, the settling touch selection, and TouchHighlighter's painted
   *  range (the touch path that needs no native selection at all). */
  function openForRange(range: Range): boolean {
    const container = containerRef.current
    if (!container || !container.contains(range.commonAncestorContainer)) return false
    const anchors = Array.from(container.querySelectorAll<HTMLElement>('[data-hl-verse]'))
      .filter(el => range.intersectsNode(el))
    if (anchors.length === 0) return false

    const splits: HighlightSplit[] = []
    for (const el of anchors) {
      const clipped = clipRangeToElement(range, el)
      if (!clipped) continue
      const start = offsetWithin(el, clipped.startContainer, clipped.startOffset)
      const end = offsetWithin(el, clipped.endContainer, clipped.endOffset)
      if (end <= start) continue
      splits.push({ book: el.dataset.hlBook!, chapter: Number(el.dataset.hlChapter), verse: Number(el.dataset.hlVerse), start, end, layer: el.dataset.hlLayer ?? 'grc' })
    }
    if (splits.length === 0) return false

    const rect = range.getBoundingClientRect()
    const key = splits.map(s => `${s.book}${s.chapter}:${s.verse}:${s.start}-${s.end}`).join('|')
    if (shownFor.current === key) return true
    shownFor.current = key
    setPopup({ kind: 'new', x: rect.left + rect.width / 2, y: rect.top, splits, text: range.toString() })
    return true
  }

  useEffect(() => {
    // Touch selection is not finished when the finger lifts — iOS leaves grab handles and the
    // reader drags them to adjust — so a coarse pointer also needs the settle timer below.
    const coarse = typeof window !== 'undefined'
      && window.matchMedia('(hover: none) and (pointer: coarse)').matches

    function onMouseUp(e: MouseEvent) {
      // Only a left-button drag-selection opens the highlight palette. Right-click
      // (button 2) leaves the word selected but must NOT pop the palette — that word's
      // right-click menu already carries its own Highlight row.
      if (e.button !== 0) return
      const container = containerRef.current
      if (!container) return
      // The mouse must be RELEASED inside the reading surface. Otherwise a left-click in a
      // floating menu — e.g. picking a colour in a word's right-click menu, where the word is
      // still selected from the earlier right-click — would be mistaken for a fresh drag and
      // pop this palette on top of (or instead of) the menu's own highlight action.
      if (!container.contains(e.target as Node)) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      const opened = openForRange(range)
      // On touch, drop the native selection once measured: iOS raises Copy / Look Up over any
      // live selection and that callout cannot be suppressed while one exists, so it would
      // cover this palette. The range is already captured and the highlight is painted from
      // it, so the reader still sees exactly what they picked.
      if (opened && coarse) window.getSelection()?.removeAllRanges()
    }

    // `pointerup` covers mouse, finger and Apple Pencil; the mouseup this used to rely on is
    // synthesised inconsistently after a touch, which is why a drag-highlight on an iPad or
    // iPhone never opened the palette.
    function onPointerUp(e: PointerEvent) {
      if (e.button !== 0) return
      onMouseUp(e as unknown as MouseEvent)
    }

    // There is no "selection finished" event, so settle for a pause — coarse pointers only,
    // where the handles keep moving after the finger lifts.
    let settle: ReturnType<typeof setTimeout> | undefined
    function onSelectionChange() {
      clearTimeout(settle)
      settle = setTimeout(() => {
        const container = containerRef.current
        const sel = window.getSelection()
        if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) return
        if (!container.contains(sel.getRangeAt(0).commonAncestorContainer)) return
        onMouseUp({ button: 0, target: sel.getRangeAt(0).commonAncestorContainer } as unknown as MouseEvent)
      }, 550)
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
        text: mark.textContent ?? '',
      })
    }

    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('click', onClick)
    if (coarse) document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('click', onClick)
      if (coarse) document.removeEventListener('selectionchange', onSelectionChange)
      clearTimeout(settle)
    }
  }, [containerRef])

  function close() { setPopup(null); shownFor.current = null; window.getSelection()?.removeAllRanges() }

  return { popup, close, openForRange }
}
