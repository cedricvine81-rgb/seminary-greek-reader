'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { SearchPageView } from './SearchPageView'
import type { MasterSearchPreset } from '@/lib/master-search-bus'

// The Master Search as a side panel over the current page (Reader, Texts, …) instead of a
// navigation: the page underneath stays mounted and visible, so there is nothing to "return"
// to and a search can be read side-by-side with the passage it came from. Desktop: a right-hand
// panel with a draggable left edge; mobile: a full-screen sheet. The full /search page still
// exists for direct visits / deep links — this hosts the same SearchPageView in embedded mode
// (no URL writes; the page underneath owns the address bar).

const WIDTH_KEY = 'masterSearchPanel.width'
const MIN_W = 400
const DEFAULT_W = 620

function clampWidth(w: number): number {
  const max = Math.round(window.innerWidth * 0.75)
  return Math.min(Math.max(w, MIN_W), Math.max(max, MIN_W))
}

export function MasterSearchPanel({ preset, onClose }: { preset?: MasterSearchPreset; onClose: () => void }) {
  const [width, setWidth] = useState(DEFAULT_W)
  const widthRef = useRef(width); widthRef.current = width
  const drag = useRef<{ startX: number; startW: number } | null>(null)

  // Hydrate the persisted width after mount (SSR-safe).
  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(WIDTH_KEY) ?? '', 10)
      if (Number.isFinite(v)) setWidth(clampWidth(v))
    } catch { /* ignore */ }
  }, [])

  // Drag the left edge to resize (desktop only — the handle is hidden below lg).
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      e.preventDefault()
      setWidth(clampWidth(drag.current.startW + (drag.current.startX - e.clientX)))
    }
    function onUp() {
      if (!drag.current) return
      drag.current = null
      document.body.style.userSelect = ''
      try { localStorage.setItem(WIDTH_KEY, String(widthRef.current)) } catch { /* ignore */ }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  // Esc closes the panel — but not while a menu/suggestion layer is likely using it: keep it
  // simple and let inner handlers stopPropagation if they need Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 lg:inset-auto lg:top-0 lg:right-0 lg:h-screen lg:w-[var(--panel-w)] z-50 flex flex-col bg-gray-50 border-l border-gray-200 shadow-2xl"
      style={{ '--panel-w': `${width}px` } as React.CSSProperties}
      role="dialog"
      aria-label="Search"
    >
      {/* Drag handle on the left edge (desktop) */}
      <div
        onPointerDown={e => {
          e.preventDefault()
          drag.current = { startX: e.clientX, startW: widthRef.current }
          document.body.style.userSelect = 'none'
        }}
        title="Drag to resize"
        className="hidden lg:flex absolute left-0 inset-y-0 w-2 -ml-1 cursor-col-resize touch-none items-center justify-center group"
      >
        <div className="h-12 w-1 rounded-full bg-gray-300 group-hover:bg-brand-400 transition-colors" />
      </div>

      {/* Panel header */}
      <div className="flex-none flex items-center justify-between pl-4 pr-2 py-1.5 border-b border-gray-200 bg-surface">
        <span className="text-sm font-semibold text-gray-700">Search</span>
        <button
          type="button"
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* The search itself — its own scroll container (the sticky controls + parsing dock
          stick within it). pb-16 mirrors the /search page's bottom clearance. */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2 pb-16">
        <SearchPageView
          embedded
          initialQuery={preset?.query}
          initialScope={preset?.scope}
          initialLemma={preset?.lemma}
          initialBooks={preset?.books}
          initialStrongs={preset?.strongs}
        />
      </div>
    </div>
  )
}
