'use client'
import { useLayoutEffect, useRef, useState } from 'react'

// A phrase diagram attached to a verse note: a SELF-CONTAINED snapshot captured from the
// Diagramming canvas — word chips with their positions and text, the drawn lines/brackets,
// and any labels. It deliberately duplicates the chip/line styling of DiagramCanvas rather
// than importing it: a snapshot must render faithfully years later without the phrase-tree
// data or the live canvas around it.
export type DiagramNoteSnapshot = {
  v: 1
  rtl?: boolean
  /** Greek font size in px at capture time — chip sizes must match or lines drift. */
  fs: number
  /** Source extents, for scale-to-fit. */
  w: number
  h: number
  words: { x: number; y: number; t: string; g?: string }[]
  lines: { x1: number; y1: number; x2: number; y2: number; dash?: boolean; arrow?: boolean; shape?: 'bracket'; flip?: boolean }[]
  labels?: { x: number; y: number; text: string }[]
}

/** Loose runtime check for a stored snapshot (the column is untyped JSON). */
export function isDiagramSnapshot(raw: unknown): raw is DiagramNoteSnapshot {
  if (!raw || typeof raw !== 'object') return false
  const d = raw as Record<string, unknown>
  return d.v === 1 && Array.isArray(d.words) && Array.isArray(d.lines)
    && typeof d.w === 'number' && typeof d.h === 'number' && typeof d.fs === 'number'
}

function bracketPath(l: DiagramNoteSnapshot['lines'][number]): string {
  const dx = l.x2 - l.x1, dy = l.y2 - l.y1
  const len = Math.hypot(dx, dy) || 1
  const t = 10
  let nx = -dy / len * t, ny = dx / len * t
  if (l.flip) { nx = -nx; ny = -ny }
  return `M ${l.x1 + nx},${l.y1 + ny} L ${l.x1},${l.y1} L ${l.x2},${l.y2} L ${l.x2 + nx},${l.y2 + ny}`
}

/** Render an attached diagram scaled to fit its container's width. */
export function DiagramNoteView({ snap }: { snap: DiagramNoteSnapshot }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / Math.max(1, snap.w)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [snap.w])

  const hasHebrew = (s: string) => /[֐-׿]/.test(s)

  return (
    <div ref={wrapRef} className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <div style={{ width: snap.w, height: snap.h, transform: `scale(${scale})`, transformOrigin: 'top left' }} className="relative">
        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }} aria-hidden>
          <defs>
            <marker id="dnv-arrow" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <path d="M0,0 L8,3.5 L0,7 Z" className="fill-gray-500" />
            </marker>
          </defs>
          {snap.lines.map((l, i) => l.shape === 'bracket' ? (
            <path key={i} d={bracketPath(l)} fill="none" className="stroke-gray-500" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={l.dash ? '6 4' : undefined} />
          ) : (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} className="stroke-gray-500" strokeWidth={2}
              strokeLinecap="round" strokeDasharray={l.dash ? '6 4' : undefined}
              markerEnd={l.arrow ? 'url(#dnv-arrow)' : undefined} />
          ))}
        </svg>
        {(snap.labels ?? []).map((l, i) => (
          <span key={`l${i}`} className="absolute select-none italic leading-tight text-gray-600"
            style={{ left: l.x, top: l.y, fontSize: snap.fs * 0.76 }}>
            {l.text}
          </span>
        ))}
        {snap.words.map((w, i) => (
          <span key={`w${i}`} className="absolute flex select-none flex-col items-start rounded border border-gray-200 bg-white px-1.5 py-0.5 shadow-sm"
            style={{ left: w.x, top: w.y }}>
            <span className={`${hasHebrew(w.t) ? 'font-hebrew' : 'font-greek'} leading-tight text-gray-900`} style={{ fontSize: snap.fs }}>{w.t}</span>
            {w.g && <span className="leading-tight text-gray-400" style={{ fontSize: snap.fs * 0.625 }}>{w.g}</span>}
          </span>
        ))}
      </div>
      {/* Reserve the scaled height (the transform doesn't affect layout). */}
      <div style={{ marginTop: -(snap.h * (1 - scale)) }} />
    </div>
  )
}
