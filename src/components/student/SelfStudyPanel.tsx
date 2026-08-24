'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, ArrowUpRight } from 'lucide-react'

// A self-study step (vocabulary, vocab quiz, parsing quiz) opened beside the study plan,
// following the app's other right-hand docks — MasterSearchPanel, GrammarPanel,
// ProsePassagePanel: on desktop the page is SQUEEZED rather than covered (globals.css keys
// off data-study-panel), so the lesson list stays visible and the student can see what they
// are working through. Mobile is a full-screen sheet.
//
// Resizable like the Grammar panel: a flashcard deck and a 15-question parsing quiz want
// different amounts of room, and that is a per-student judgement.

const WIDTH_KEY = 'studyPanel.width'
const MIN_W = 380
const DEFAULT_W = 560

function clampWidth(w: number): number {
  const max = Math.round(window.innerWidth * 0.65)
  return Math.min(Math.max(w, MIN_W), Math.max(max, MIN_W))
}

export function SelfStudyPanel({ title, subtitle, fullHref, fullLabel, closeLabel, resizeLabel, onClose, children }: {
  title: string
  subtitle?: string
  /** The step's own page — the escape hatch to a full-width view. */
  fullHref: string
  fullLabel: string
  closeLabel: string
  resizeLabel: string
  onClose: () => void
  children: React.ReactNode
}) {
  const [width, setWidth] = useState(DEFAULT_W)
  const widthRef = useRef(width); widthRef.current = width
  const drag = useRef<{ startX: number; startW: number } | null>(null)

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(WIDTH_KEY) ?? '', 10)
      if (Number.isFinite(v)) setWidth(clampWidth(v))
    } catch { /* ignore */ }
  }, [])

  // Squeeze the page rather than cover it (desktop).
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-study-panel', '1')
    root.style.setProperty('--study-panel-w', `${width}px`)
    return () => {
      root.removeAttribute('data-study-panel')
      root.style.removeProperty('--study-panel-w')
    }
  }, [width])

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:right-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[var(--panel-w)] flex flex-col bg-surface border-l border-gray-200 shadow-xl"
      style={{ '--panel-w': `${width}px` } as React.CSSProperties}
      role="dialog"
      aria-label={title}
    >
      {/* Drag handle on the left edge (desktop) */}
      <div
        onPointerDown={e => {
          e.preventDefault()
          drag.current = { startX: e.clientX, startW: widthRef.current }
          document.body.style.userSelect = 'none'
        }}
        title={resizeLabel}
        className="hidden lg:flex absolute left-0 inset-y-0 w-2 -ml-1 cursor-col-resize touch-none items-center justify-center group"
      >
        <div className="h-12 w-1 rounded-full bg-gray-300 group-hover:bg-brand-400 transition-colors" />
      </div>

      <div className="flex-none flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={fullHref}
            title={fullLabel}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
          >
            {fullLabel} <ArrowUpRight size={11} />
          </Link>
          <button onClick={onClose} aria-label={closeLabel} title={closeLabel} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
        {children}
      </div>
    </div>
  )
}
