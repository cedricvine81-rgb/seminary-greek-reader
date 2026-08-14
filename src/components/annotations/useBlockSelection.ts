import { useEffect, useRef, useState, type RefObject } from 'react'
import { offsetWithin, clipRangeToElement } from '@/components/highlights/range-utils'
import { isExamLocked } from '@/lib/exam-lockdown'

export interface BlockSelection {
  blockId: string
  start: number
  end: number
  quote: string
  /** The block's whole plain text, so the caller can fingerprint what it measured against. */
  blockText: string
  /** True when the native selection was dropped after capture (touch devices — see below),
   *  so the caller knows to paint the range itself; there is nothing left to show it. */
  cleared: boolean
}

export type BlockPopupState =
  | { kind: 'new'; x: number; y: number; sel: BlockSelection }
  | { kind: 'edit'; x: number; y: number; id: string }

/**
 * Turns a selection inside `containerRef` into a range anchored to ONE prose block.
 *
 * The only integration requirement is `data-ann-block="<stable id>"` on each annotatable
 * element — the same contract `useHighlightSelection` has with `data-hl-verse`, and the
 * reason wiring the Grammar chapters was three components rather than forty-four files.
 *
 * A selection that crosses blocks is clipped to the block it STARTS in rather than split
 * into several. Verses are addressable units a reader means to span; a paragraph boundary in
 * running prose is not, and three notes from one drag is not what anybody meant.
 */
export function useBlockSelection(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const [popup, setPopup] = useState<BlockPopupState | null>(null)
  // Which selection the popup is currently for, so a settling selection doesn't reopen it on
  // every adjustment — and so dismissing it doesn't immediately spring it back.
  const shownFor = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Touch selection is not finished when the finger lifts — iOS leaves grab handles and
    // the reader drags them to adjust — and it is the platform whose callout we are avoiding.
    const coarse = typeof window !== 'undefined'
      && window.matchMedia('(hover: none) and (pointer: coarse)').matches

    /** Read the live selection, or null if it isn't an annotatable range in one block. */
    function currentSelection(): { sel: BlockSelection; rect: DOMRect } | null {
      // Never during a locked exam — the Grammar page must not become a way to open a
      // writing surface mid-exam.
      if (isExamLocked()) return null
      const container = containerRef.current
      if (!container) return null
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return null

      const block = (range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement
      )?.closest<HTMLElement>('[data-ann-block]')
      if (!block || !container.contains(block)) return null

      const clipped = clipRangeToElement(range, block)
      if (!clipped) return null
      const start = offsetWithin(block, clipped.startContainer, clipped.startOffset)
      const end = offsetWithin(block, clipped.endContainer, clipped.endOffset)
      if (end <= start) return null

      const blockText = block.textContent ?? ''
      return {
        sel: { blockId: block.dataset.annBlock!, start, end, quote: blockText.slice(start, end), blockText, cleared: false },
        rect: clipped.getBoundingClientRect(),
      }
    }

    function offer() {
      const found = currentSelection()
      if (!found) return
      const key = `${found.sel.blockId}:${found.sel.start}:${found.sel.end}`
      if (shownFor.current === key) return
      shownFor.current = key

      // On a touch device, drop the native selection now that we have measured it.
      //
      // iOS raises Copy / Look Up / Translate / Search Web for any live selection, and that
      // menu cannot be suppressed while one exists — it opened on top of our own palette
      // every time. The callout belongs to the selection, so clearing the selection takes it
      // with it. The range is already captured, and the caller paints it, so the reader still
      // sees exactly what they picked; the Copy the menu provided is on our palette instead.
      if (coarse) {
        window.getSelection()?.removeAllRanges()
        found.sel.cleared = true
      }
      setPopup({ kind: 'new', x: found.rect.left + found.rect.width / 2, y: found.rect.top, sel: found.sel })
    }

    // `pointerup`, not `mouseup`: one event covers mouse, finger and Apple Pencil. The
    // mouseup this used to listen for is synthesised inconsistently after a touch, which is
    // why the popover never appeared on an iPad.
    function onPointerUp(e: PointerEvent) {
      if (e.button !== 0) return   // right-click leaves a selection the word menu owns
      const container = containerRef.current
      if (!container || !container.contains(e.target as Node)) return
      offer()
    }

    // There is no "selection finished" event, so settle for a pause. Coarse pointers only:
    // on desktop the pointerup above is exact, and running this as well would pop the palette
    // during an ordinary click-drag.
    let settle: ReturnType<typeof setTimeout> | undefined
    function onSelectionChange() {
      clearTimeout(settle)
      settle = setTimeout(offer, 550)
    }

    document.addEventListener('pointerup', onPointerUp)
    if (coarse) document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('pointerup', onPointerUp)
      if (coarse) document.removeEventListener('selectionchange', onSelectionChange)
      clearTimeout(settle)
    }
  }, [containerRef, enabled])

  function open(id: string, x: number, y: number) {
    shownFor.current = null
    setPopup({ kind: 'edit', x, y, id })
  }
  function close() {
    setPopup(null)
    // Keep the key: the selection is still on screen for a moment after a touch dismiss, and
    // without this the settle timer would reopen what the reader just closed.
    window.getSelection()?.removeAllRanges()
  }

  return { popup, open, close }
}
