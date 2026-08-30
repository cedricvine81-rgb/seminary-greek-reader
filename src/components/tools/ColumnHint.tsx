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

export function ColumnHint({ label, hint, align = 'right' }: {
  label: React.ReactNode
  /** Message key for the explanation. */
  hint: string
  /** Which edge of the heading the bubble hangs from — numeric columns are right-aligned. */
  align?: 'left' | 'right'
}) {
  const t = useT()
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)
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
    setAt({ top: r.bottom + 6, left })
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
          style={{ position: 'fixed', top: at.top, left: at.left, width: BUBBLE_WIDTH }}
          className="z-50 block rounded-lg border border-gray-200 bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-gray-700 shadow-lg print:hidden"
        >
          {t(hint)}
        </span>
      )}
    </>
  )
}
