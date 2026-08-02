'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, GraduationCap, ArrowUpRight } from 'lucide-react'
import { MorphologyView } from '@/components/vocab/MorphologyView'
import type { GrammarPanelTarget } from '@/lib/grammar-panel-bus'
import type { MainTab } from '@/components/vocab/MorphologyView'

// The Grammar as a side panel beside the Reader, following MasterSearchPanel: on desktop the
// app content is squeezed rather than covered (globals.css keys off data-grammar-panel), so
// the verse stays visible while the chapter explaining it is read alongside. Mobile is a
// full-screen sheet.
//
// Resizable, unlike the page-guide panel — paradigm tables are wide, and how much room the
// Grammar deserves against the text is a per-reader judgment.

const WIDTH_KEY = 'grammarPanel.width'
const MIN_W = 420
const DEFAULT_W = 640

function clampWidth(w: number): number {
  const max = Math.round(window.innerWidth * 0.65)
  return Math.min(Math.max(w, MIN_W), Math.max(max, MIN_W))
}

export function GrammarPanel({ target, onClose }: { target: GrammarPanelTarget; onClose: () => void }) {
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
    root.setAttribute('data-grammar-panel', '1')
    root.style.setProperty('--grammar-panel-w', `${width}px`)
    return () => {
      root.removeAttribute('data-grammar-panel')
      root.style.removeProperty('--grammar-panel-w')
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
      aria-label="Grammar"
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

      <div className="flex-none flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <GraduationCap size={13} /> Grammar
          </p>
          {target.fromCategory && (
            <p className="mt-0.5 text-sm text-gray-700 truncate">{target.fromCategory}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Escape hatch to the full page, for anyone who wants the whole chapter list. */}
          <Link
            href={`/grammar?chapter=${encodeURIComponent(target.chapter)}&level=${target.level}`}
            onClick={onClose}
            title="Open the full Grammar page"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
          >
            Full page <ArrowUpRight size={11} />
          </Link>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-8">
        <MorphologyView
          embedded
          initialChapter={target.chapter as MainTab}
          initialLevel={target.level}
          onRequestClose={onClose}
        />
      </div>
    </div>
  )
}
