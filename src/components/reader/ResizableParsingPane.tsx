'use client'
import { useEffect, useRef, useState } from 'react'
import { ParsingPanel } from './ParsingPanel'
import { useParsingPaneHeight } from '@/lib/parsing-pane-height'
import type { LexicalInfoPanel } from '@/types/lexicon'

// The parsing pane wrapped in a drag-to-resize card, shared by every reading surface (Reader +
// Exegesis tabs). The grab-bar sets a height shared across all panes (useParsingPaneHeight); the
// reading/results area above is flex-1 min-h-0, so growing the pane simply shrinks it. Resize is
// desktop-only — below lg the pane keeps its previous fixed height (h-64) and the mobile Reader
// keeps its own bottom sheet, so touch layouts are untouched.

function useIsDesktop() {
  const [d, setD] = useState(true)   // SSR/first paint: assume desktop (matches lg: layout)
  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)')
    const on = () => setD(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return d
}

export function ResizableParsingPane({ storageKey, info, locked = false, bgClass = 'bg-surface', className = '', growDown = false }: {
  storageKey: string   // per-surface key so each pane keeps its own height (e.g. 'reader', 'texts')
  info: LexicalInfoPanel | null
  locked?: boolean
  bgClass?: string
  className?: string   // e.g. 'hidden lg:block' for the Reader's desktop-only pane
  growDown?: boolean   // top-anchored placements (Synopsis, Notes) where the box grows downward
                       // in normal flow: put the handle below the box and let drag-down enlarge it,
                       // so the grab bar tracks the edge that actually moves. Bottom-anchored panes
                       // (Reader, Texts, …) leave this off: handle on top, drag-up enlarges.
}) {
  const isDesktop = useIsDesktop()
  const [height, setHeight, persist] = useParsingPaneHeight(storageKey)
  const hRef = useRef(height); hRef.current = height
  const drag = useRef<{ startY: number; startH: number } | null>(null)

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      e.preventDefault()
      const delta = growDown ? e.clientY - drag.current.startY : drag.current.startY - e.clientY
      setHeight(drag.current.startH + delta)
    }
    function onUp() {
      if (!drag.current) return
      drag.current = null
      document.body.style.userSelect = ''
      persist()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [setHeight, persist, growDown])

  const handle = isDesktop && (
    <div
      onPointerDown={e => { e.preventDefault(); drag.current = { startY: e.clientY, startH: hRef.current }; document.body.style.userSelect = 'none' }}
      title="Drag to resize the parsing pane"
      className="mx-auto flex h-3 w-full max-w-[10rem] cursor-row-resize touch-none items-center justify-center"
    >
      <div className="h-1 w-12 rounded-full bg-gray-300 transition-colors hover:bg-gray-400" />
    </div>
  )

  return (
    <div className={`flex-none ${className}`}>
      {!growDown && handle}
      <div
        style={isDesktop ? { height } : undefined}
        className={`flex flex-col overflow-hidden rounded-xl border shadow-sm ${bgClass} ${isDesktop ? '' : 'h-64'} ${locked ? 'border-brand-400 ring-1 ring-brand-300' : 'border-gray-200'}`}
      >
        <ParsingPanel info={info} locked={locked} bgClass={bgClass} variant="sheet" />
      </div>
      {growDown && handle}
    </div>
  )
}
