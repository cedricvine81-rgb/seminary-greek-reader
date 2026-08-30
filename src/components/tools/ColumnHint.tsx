'use client'

// A column heading that can explain itself.
//
// The table columns each hold a number that means something precise, and there is nowhere in a
// heading to say what — "Distance", "Classical", "Per 1,000 words" all need a sentence or two
// that would drown the table if it were printed beside them. Tap or focus the heading and it
// says it.
//
// Follows the glossary Term in the Grammar chapters: dotted underline, click to toggle, blur
// to close. One difference, and it is the reason this is not a plain absolutely-positioned
// bubble: the tables live inside `overflow-x-auto`, and a container with overflow-x set also
// computes overflow-y to auto, so an absolute popover inside one is clipped at the table's
// edge. The bubble is positioned FIXED from the heading's own rectangle instead, which no
// overflow ancestor can crop.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'

const BUBBLE_WIDTH = 288          // w-72, matched here because the clamp needs the number
const EDGE = 8
const MIN_BUBBLE_HEIGHT = 260     // never collapse, however the viewport measures

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

  // A fixed bubble does not travel with the page, so it closes rather than drifting.
  useEffect(() => {
    if (!at) return
    const close = () => setAt(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [at])

  return (
    <>
      <button
        ref={ref} type="button"
        onClick={() => (at ? setAt(null) : place())}
        onBlur={() => setAt(null)}
        aria-expanded={!!at}
        className="cursor-help underline decoration-dotted decoration-gray-300 underline-offset-4 print:no-underline"
      >
        {label}
      </button>
      {at && (
        <span
          role="tooltip"
          style={{
            position: 'fixed', top: at.top, left: at.left,
            width: BUBBLE_WIDTH, maxHeight: at.maxHeight,
          }}
          className="z-50 block overflow-y-auto rounded-lg border border-gray-200 bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-gray-700 shadow-lg print:hidden"
        >
          {(Array.isArray(hint) ? hint : [hint]).map((k, i) => (
            <span key={k} className={i ? 'mt-2 block' : 'block'}>{t(k)}</span>
          ))}
        </span>
      )}
    </>
  )
}
