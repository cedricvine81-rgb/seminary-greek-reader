'use client'

import { useEffect, useRef } from 'react'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import { useParsingPaneHeight } from '@/lib/parsing-pane-height'
import type { LexicalInfoPanel } from '@/types/lexicon'

// The search page's parsing pane: docked to the bottom of the viewport whenever Greek results
// are shown, filled by hovering/clicking a Greek word. The grab-bar drags to resize; height is
// the app-wide shared parsing-pane height (useParsingPaneHeight), so it matches the Reader and
// Exegesis panes. Unlike those (flex rows), this one is a sticky overlay because /search scrolls
// the whole page rather than using a fixed-height flex column.

export function ParsingDock({ info }: { info: LexicalInfoPanel | null }) {
  const [height, setHeight, persist] = useParsingPaneHeight()
  const heightRef = useRef(height); heightRef.current = height
  const drag = useRef<{ startY: number; startH: number } | null>(null)

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      e.preventDefault()
      setHeight(drag.current.startH + (drag.current.startY - e.clientY))
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
  }, [setHeight, persist])

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
        <div className="h-1 w-12 rounded-full bg-gray-300 transition-colors hover:bg-gray-400" />
      </div>
      <div style={{ height }} className="overflow-y-auto bg-gray-50/95 pb-1 backdrop-blur">
        <ParsingPanel info={info} bgClass="bg-surface" />
      </div>
    </div>
  )
}
