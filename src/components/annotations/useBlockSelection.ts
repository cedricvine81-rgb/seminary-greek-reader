import { useEffect, useState, type RefObject } from 'react'
import { offsetWithin, clipRangeToElement } from '@/components/highlights/range-utils'
import { isExamLocked } from '@/lib/exam-lockdown'

export interface BlockSelection {
  blockId: string
  start: number
  end: number
  quote: string
  /** The block's whole plain text, so the caller can fingerprint what it measured against. */
  blockText: string
}

export type BlockPopupState =
  | { kind: 'new'; x: number; y: number; sel: BlockSelection }
  | { kind: 'edit'; x: number; y: number; id: string }

/**
 * Turns a drag-selection inside `containerRef` into a range anchored to ONE prose block.
 *
 * The only integration requirement is `data-ann-block="<stable id>"` on each annotatable
 * element — the same contract `useHighlightSelection` has with `data-hl-verse`, and the
 * reason wiring the Grammar chapters was three components rather than forty-four files.
 *
 * A selection that crosses blocks is clipped to the block it STARTS in rather than split
 * into several. Verses are addressable units a reader means to span; a paragraph boundary
 * in running prose is not, and three notes from one drag is not what anybody meant.
 */
export function useBlockSelection(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const [popup, setPopup] = useState<BlockPopupState | null>(null)

  useEffect(() => {
    if (!enabled) return

    function onMouseUp(e: MouseEvent) {
      // Left button only: right-click leaves a selection behind, and the word menu that
      // opens on it carries its own actions.
      if (e.button !== 0) return
      // Never during a locked exam — the Grammar page must not become a way to open a
      // writing surface mid-exam.
      if (isExamLocked()) return
      const container = containerRef.current
      if (!container || !container.contains(e.target as Node)) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return

      const block = (range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement
      )?.closest<HTMLElement>('[data-ann-block]')
      if (!block || !container.contains(block)) return

      const clipped = clipRangeToElement(range, block)
      if (!clipped) return
      const start = offsetWithin(block, clipped.startContainer, clipped.startOffset)
      const end = offsetWithin(block, clipped.endContainer, clipped.endOffset)
      if (end <= start) return

      const blockText = block.textContent ?? ''
      const rect = clipped.getBoundingClientRect()
      setPopup({
        kind: 'new',
        x: rect.left + rect.width / 2,
        y: rect.top,
        sel: { blockId: block.dataset.annBlock!, start, end, quote: blockText.slice(start, end), blockText },
      })
    }

    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [containerRef, enabled])

  function open(id: string, x: number, y: number) { setPopup({ kind: 'edit', x, y, id }) }
  function close() { setPopup(null); window.getSelection()?.removeAllRanges() }

  return { popup, open, close }
}
