'use client'

import { useEffect, useRef, useState } from 'react'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { LexicalInfoPanel } from '@/types/lexicon'

// The search page's parsing pane: docked to the bottom of the viewport whenever Greek results
// are shown, filled by hovering/clicking a Greek word. The grab-bar above it drags to resize
// the pane against the results (height persisted, shared by every search lane).

const STORAGE_KEY = 'search:parsingPaneH'
const MIN_H = 88
const MAX_H = 480
const DEFAULT_H = 176

export function ParsingDock({ info }: { info: LexicalInfoPanel | null }) {
  const [height, setHeight] = useState(DEFAULT_H)
  const heightRef = useRef(height); heightRef.current = height
  const drag = useRef<{ startY: number; startH: number } | null>(null)

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10)
      if (v >= MIN_H && v <= MAX_H) setHeight(v)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      e.preventDefault()
      const next = Math.min(MAX_H, Math.max(MIN_H, drag.current.startH + (drag.current.startY - e.clientY)))
      heightRef.current = next   // keep the ref current NOW — onUp persists before React re-renders
      setHeight(next)
    }
    function onUp() {
      if (!drag.current) return
      drag.current = null
      document.body.style.userSelect = ''
      try { localStorage.setItem(STORAGE_KEY, String(heightRef.current)) } catch { /* ignore */ }
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

  return (
    // bottom-14 below lg keeps the dock above the fixed mobile bottom nav.
    <div className="sticky bottom-14 lg:bottom-0 z-10">
      <div
        onPointerDown={e => {
          e.preventDefault()
          drag.current = { startY: e.clientY, startH: heightRef.current }
          document.body.style.userSelect = 'none'
        }}
        title="Drag to resize the parsing pane"
        className="flex h-3 cursor-row-resize touch-none items-center justify-center bg-gray-50/95 backdrop-blur"
      >
        <div className="h-1 w-12 rounded-full bg-gray-300" />
      </div>
      <div style={{ height }} className="overflow-y-auto bg-gray-50/95 pb-1 backdrop-blur">
        <ParsingPanel info={info} bgClass="bg-surface" />
      </div>
    </div>
  )
}
