'use client'

// A heading that can explain itself.
//
// The table columns each hold a number that means something precise, and there is nowhere in a
// heading to say what — "Distance", "Classical", "Per 1,000 words" all need a sentence or two
// that would drown the table if it were printed beside them. Point at the heading and it says
// it; tap it, or focus it from the keyboard, and it stays.
//
// Hover OPENS, but only for a mouse: `pointerType` tells a real cursor from the synthetic one
// a tap emits, so a touch never opens a bubble it cannot then dismiss by moving away. A short
// delay before opening keeps a cursor crossing the table from flashing bubbles as it goes, and
// a grace period on leaving lets the pointer travel INTO the bubble — the longer hints are
// several paragraphs and scroll, which would be unreachable if the bubble fled the cursor.
// Clicking pins it open, so a hint can be read with the mouse somewhere else entirely.
//
// One structural note, and it is the reason this is not a plain absolutely-positioned bubble:
// the tables live inside `overflow-x-auto`, and a container with overflow-x set also computes
// overflow-y to auto, so an absolute popover inside one is clipped at the table's edge. The
// bubble is positioned FIXED from the heading's own rectangle instead, which no overflow
// ancestor can crop.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { emphasise } from '@/lib/emphasise'

const BUBBLE_WIDTH = 288          // w-72, matched here because the clamp needs the number
const EDGE = 8
const MIN_BUBBLE_HEIGHT = 260     // never collapse, however the viewport measures
const OPEN_DELAY = 110            // long enough that crossing a row does not open anything
const CLOSE_GRACE = 180           // long enough to reach the bubble from the heading

export function ColumnHint({ label, hint, align = 'right' }: {
  label: React.ReactNode
  /** Message key, or several — rendered as paragraphs, for a heading that needs an argument. */
  hint: string | string[]
  /** Which edge of the heading the bubble hangs from — numeric columns are right-aligned. */
  align?: 'left' | 'right'
}) {
  const t = useT()
  const [at, setAt] = useState<{ top: number; left: number; maxHeight: number } | null>(null)
  const ref = useRef<HTMLButtonElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  // A click pins the bubble; hovering away then leaves it alone. A ref, not state, because the
  // timers below fire outside the render that scheduled them and nothing here paints from it.
  const pinnedRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopTimer = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [])

  const place = useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const raw = align === 'right' ? r.right - BUBBLE_WIDTH : r.left
    const left = Math.min(
      Math.max(EDGE, raw),
      Math.max(EDGE, window.innerWidth - BUBBLE_WIDTH - EDGE),
    )
    // Capped in PIXELS measured at open time rather than in vh: a viewport height of 0 — which
    // some embedded contexts report — turns a vh cap into a bubble one line tall with the rest
    // scrolled out of reach. The floor means it degrades to "a bit too tall", never to nothing.
    const top = r.bottom + 6
    const room = window.innerHeight ? window.innerHeight - top - EDGE : 0
    setAt({ top, left, maxHeight: Math.max(MIN_BUBBLE_HEIGHT, room) })
  }, [align])

  const close = useCallback(() => {
    stopTimer()
    pinnedRef.current = false
    setAt(null)
  }, [stopTimer])

  const hoverOpen = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return          // a tap is handled by the click below
    stopTimer()
    timer.current = setTimeout(place, OPEN_DELAY)
  }, [place, stopTimer])

  const hoverClose = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    stopTimer()
    timer.current = setTimeout(() => { if (!pinnedRef.current) setAt(null) }, CLOSE_GRACE)
  }, [stopTimer])

  useEffect(() => stopTimer, [stopTimer])

  // A fixed bubble does not travel with the page, so it closes rather than drifting — unless
  // the scrolling is happening INSIDE it, which is how the several-paragraph hints are read.
  useEffect(() => {
    if (!at) return
    const onScroll = (e: Event) => {
      const n = e.target
      if (bubbleRef.current && n instanceof Node && bubbleRef.current.contains(n)) return
      close()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [at, close])

  return (
    <>
      <button
        ref={ref} type="button"
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onClick={() => {
          stopTimer()
          if (pinnedRef.current) { close(); return }
          pinnedRef.current = true
          place()
        }}
        onFocus={place}
        onBlur={close}
        aria-expanded={!!at}
        className="cursor-help underline decoration-dotted decoration-gray-300 underline-offset-4 print:no-underline"
      >
        {label}
      </button>
      {at && (
        <span
          ref={bubbleRef}
          role="tooltip"
          // The pointer may travel from the heading into the bubble to read or scroll it.
          onPointerEnter={stopTimer}
          onPointerLeave={hoverClose}
          style={{
            position: 'fixed', top: at.top, left: at.left,
            width: BUBBLE_WIDTH, maxHeight: at.maxHeight,
          }}
          className="z-50 block overflow-y-auto rounded-lg border border-gray-200 bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-gray-700 shadow-lg print:hidden"
        >
          {(Array.isArray(hint) ? hint : [hint]).map((k, i) => (
            <span key={k} className={i ? 'mt-2 block' : 'block'}>{emphasise(t(k))}</span>
          ))}
        </span>
      )}
    </>
  )
}
