'use client'
import { useEffect, useRef, useState, type RefObject } from 'react'
import clsx from 'clsx'
import { Highlighter } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

/**
 * Drag-to-highlight for touch devices — a floating pen button that arms a one-shot paint
 * mode: touch the text and drag, and on release the colour palette opens for exactly the
 * painted stretch.
 *
 * WHY A MODE, not native selection: on iPad the reader deliberately turns text selection
 * OFF for reading words (globals.css) because long-press belongs to the word menus — so the
 * desktop gesture (drag a selection, palette pops) is physically impossible on touch, which
 * is the "drag-highlight doesn't work on the iPad" report. A pencil button the reader arms
 * first never fights the word menus, scrolling, or iOS's own selection UI.
 *
 * The painted range comes from caretRangeFromPoint under the finger — no native selection
 * is ever created, so no Copy/Look-Up callout appears. Live feedback paints through the CSS
 * Custom Highlight API (the same mechanism as the Grammar annotations); on WebKit versions
 * without it the drag still works, only the live tint is missing.
 *
 * Renders nothing on fine-pointer (mouse) devices — desktop drag-selection already works.
 */

const PAINT_NAME = 'hl-touch-paint'

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y)
    return r ? { node: r.startContainer, offset: r.startOffset } : null
  }
  const p = doc.caretPositionFromPoint?.(x, y)
  return p ? { node: p.offsetNode, offset: p.offset } : null
}

function paintLive(range: Range | null) {
  const css = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS
  const Ctor = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight
  if (!css?.highlights || !Ctor) return
  if (range) css.highlights.set(PAINT_NAME, new Ctor(range))
  else css.highlights.delete(PAINT_NAME)
}

export function TouchHighlighter({ containerRef, onRange }: {
  containerRef: RefObject<HTMLElement | null>
  onRange: (range: Range) => boolean
}) {
  const t = useT()
  const [coarse, setCoarse] = useState(false)
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    setCoarse(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])

  const anchor = useRef<{ node: Node; offset: number } | null>(null)

  useEffect(() => {
    if (!armed) return
    const container = containerRef.current
    if (!container) return

    // While armed: the finger paints, so it must not scroll, and it must not wake the word
    // menus — touch-action stops the scroll, the attribute opts the whole surface out of
    // NativeMenuGuard's long-press, and the capture-phase touchstart stop keeps the words'
    // own long-press timers (React bubble listeners) from ever starting.
    const prevTouchAction = container.style.touchAction
    container.style.touchAction = 'none'
    container.setAttribute('data-longpress-own', '')
    const swallowTouch = (e: TouchEvent) => e.stopPropagation()
    container.addEventListener('touchstart', swallowTouch, true)

    function currentRange(x: number, y: number): Range | null {
      const focus = caretAt(x, y)
      const from = anchor.current
      const el = containerRef.current
      if (!focus || !from || !el) return null
      if (!el.contains(focus.node) || !el.contains(from.node)) return null
      const range = document.createRange()
      range.setStart(from.node, from.offset)
      range.setEnd(focus.node, focus.offset)
      if (range.collapsed) {
        // Dragged backwards — a range cannot be reversed, so swap the ends.
        range.setStart(focus.node, focus.offset)
        range.setEnd(from.node, from.offset)
      }
      return range
    }

    function onDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return
      const start = caretAt(e.clientX, e.clientY)
      if (!start || !containerRef.current?.contains(start.node)) return
      anchor.current = start
      e.preventDefault()
    }
    function onMove(e: PointerEvent) {
      if (!anchor.current) return
      e.preventDefault()
      paintLive(currentRange(e.clientX, e.clientY))
    }
    function onUp(e: PointerEvent) {
      if (!anchor.current) return
      const range = currentRange(e.clientX, e.clientY)
      anchor.current = null
      paintLive(null)
      if (range && !range.collapsed && onRange(range)) setArmed(false)
    }
    function onCancel() {
      anchor.current = null
      paintLive(null)
    }

    container.addEventListener('pointerdown', onDown)
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerup', onUp)
    container.addEventListener('pointercancel', onCancel)
    return () => {
      container.style.touchAction = prevTouchAction
      container.removeAttribute('data-longpress-own')
      container.removeEventListener('touchstart', swallowTouch, true)
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onCancel)
      anchor.current = null
      paintLive(null)
    }
  }, [armed, containerRef, onRange])

  if (!coarse) return null

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {armed && (
        <span className="max-w-[14rem] rounded-lg border border-gray-200 bg-popover px-3 py-1.5 text-xs leading-snug text-gray-600 shadow-lg">
          {t('hl.touchHint')}
        </span>
      )}
      <button
        type="button"
        onClick={() => setArmed(a => !a)}
        aria-pressed={armed}
        title={t('hl.touchMode')}
        aria-label={t('hl.touchMode')}
        className={clsx(
          'flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition-colors',
          armed
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-gray-200 bg-surface text-gray-500',
        )}
      >
        <Highlighter size={19} />
      </button>
    </div>
  )
}
