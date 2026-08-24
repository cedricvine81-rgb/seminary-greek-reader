'use client'
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Move, Slash, Brackets, Type, Magnet, Languages, FlipHorizontal2, RotateCcw, X } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { usePref } from '@/lib/use-pref'
import { openWordSearch } from '@/lib/word-search-bus'
import { hasHebrew } from '@/lib/script-detect'
import { WordCtx, type WordNodeT } from './PhraseExplorer'

// The Diagramming tab's canvas: the sentence's words as freely draggable chips, plus
// hand-drawn annotation lines and text labels. One canvas per sentence card; the whole
// layout round-trips as one JSON blob (chip positions keyed by word occurrence + lines
// + labels).
//
// Move mode: drag a chip (or a marquee-selected group) to move it; shift-click adds a chip
// to the selection; click a line to select it, then drag its body to move it whole or its
// endpoint handles to change direction and length; a selected line's floating pill offers
// dashed / arrowhead / delete. Line mode: drag anywhere to draw (snapped to 45° steps
// while the magnet toggle is on — the Reed-Kellogg baseline/divider/modifier angles).
// Label mode: click to place a text label (function names, relations, supplied words);
// in move mode labels drag, click-select, and double-click to re-edit.
// A "bracket" is stored as a line whose segment is the bracket's spine; ticks are drawn
// perpendicular at both ends (like "]"), `flip` mirrors them (like "[").
export type DiagramLine = { x1: number; y1: number; x2: number; y2: number; dash?: boolean; arrow?: boolean; shape?: 'bracket'; flip?: boolean }
export type DiagramLabel = { x: number; y: number; text: string }
export type DiagramData = { words: Record<string, { x: number; y: number }>; lines: DiagramLine[]; labels?: DiagramLabel[] }

type Pos = { x: number; y: number }
type Mode = 'move' | 'line' | 'bracket' | 'label'

// One in-flight pointer gesture on the canvas itself (chip/label drags live on their elements).
type Interaction =
  | { kind: 'draw'; x: number; y: number; shape?: 'bracket' }
  | { kind: 'marquee'; x: number; y: number; moved: boolean }
  | { kind: 'lineBody'; i: number; x: number; y: number; orig: DiagramLine; moved: boolean }
  | { kind: 'endpoint'; i: number; end: 1 | 2; moved: boolean }

// A word's key in the layout JSON: id + occurrence index. Hebrew morphemes of one written
// word share an id (בְּ and רֵאשִׁית are both Gen.1.1.1), so the id alone is not unique.
const wordKey = (w: WordNodeT, i: number) => `${w.id}#${i}`

const MIN_CANVAS_H = 400

/** Snap a line's free end to the nearest 45° step around its anchored end. */
function snap45(x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 1) return { x: x2, y: y2 }
  const step = Math.PI / 4
  const ang = Math.round(Math.atan2(y2 - y1, x2 - x1) / step) * step
  return { x: x1 + Math.cos(ang) * len, y: y1 + Math.sin(ang) * len }
}

/** A bracket's path: the spine plus perpendicular ticks at both ends. Drawn top-to-bottom
 *  the ticks point left ("]", as grouping brackets usually close); `flip` mirrors ("["). */
function bracketPath(l: DiagramLine): string {
  const dx = l.x2 - l.x1, dy = l.y2 - l.y1
  const len = Math.hypot(dx, dy) || 1
  const t = 10
  let nx = -dy / len * t, ny = dx / len * t
  if (l.flip) { nx = -nx; ny = -ny }
  return `M ${l.x1 + nx},${l.y1 + ny} L ${l.x1},${l.y1} L ${l.x2},${l.y2} L ${l.x2 + nx},${l.y2 + ny}`
}

export function DiagramCanvas({ words, rtl = false, initialData, onSave, readOnly = false }: {
  words: WordNodeT[]
  rtl?: boolean
  /** Saved layout to restore, if the user has one for this sentence. */
  initialData?: DiagramData | null
  /** Persist the whole layout; null means "reset" (delete the saved diagram). */
  onSave?: (d: DiagramData | null) => Promise<void>
  /** Render the layout without any editing — no toolbar, no drags, no drawing.
   *  Used for submitted assignment work and the instructor's grading view. */
  readOnly?: boolean
}) {
  const t = useT()
  const uid = useId()
  const { onWord } = useContext(WordCtx)
  const canvasRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // null → chips render hidden first so the layout effect below can measure their real
  // sizes, then take absolute positions: a VERTICAL column down the start edge (left for
  // Greek, right for Hebrew), one word per line in verse order — the student drags words
  // out of the column into place, and the canvas keeps working space below the lowest chip.
  const [positions, setPositions] = useState<Record<string, Pos> | null>(null)
  const [lines, setLines] = useState<DiagramLine[]>(initialData?.lines ?? [])
  const [labels, setLabels] = useState<DiagramLabel[]>(initialData?.labels ?? [])
  const [mode, setMode] = useState<Mode>('move')
  // Straighten (snap to 45° steps) — on by default: baselines and dividers come out clean.
  const [snap, setSnap] = useState(true)
  // Show/hide the English glosses under the Greek — a shared device preference, so
  // toggling it on one sentence card flips every card at once.
  const [showGloss, setShowGloss] = usePref<'1' | '0'>('diagram-gloss', ['1', '0'], '1')
  const [selLine, setSelLine] = useState<number | null>(null)
  const [selLabel, setSelLabel] = useState<number | null>(null)
  const [selChips, setSelChips] = useState<Set<string>>(new Set())
  const [editLabel, setEditLabel] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [preview, setPreview] = useState<DiagramLine | null>(null)
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Seed positions as a vertical verse-order column, overlaid with any saved positions.
  useLayoutEffect(() => {
    if (positions !== null) return
    const cw = canvasRef.current?.clientWidth ?? 600
    const seed: Record<string, Pos> = {}
    let y = 16
    words.forEach((w, i) => {
      const el = chipRefs.current.get(wordKey(w, i))
      const h = el?.offsetHeight ?? 40
      const wdt = el?.offsetWidth ?? 48
      seed[wordKey(w, i)] = { x: rtl ? Math.max(16, cw - wdt - 16) : 16, y }
      y += h + 8
    })
    // Saved positions win; the seed fills in any word the saved layout doesn't know
    // (it shouldn't happen for a stable sentence, but never strand a word off-canvas).
    setPositions({ ...seed, ...(initialData?.words ?? {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, words])

  useEffect(() => () => { if (statusTimer.current) clearTimeout(statusTimer.current) }, [])

  function persist(next: { positions: Record<string, Pos>; lines: DiagramLine[]; labels: DiagramLabel[] } | null) {
    if (!onSave || readOnly) return
    void onSave(next ? { words: next.positions, lines: next.lines, labels: next.labels } : null).then(() => {
      setStatus('saved')
      if (statusTimer.current) clearTimeout(statusTimer.current)
      statusTimer.current = setTimeout(() => setStatus('idle'), 1600)
    }).catch(() => {})
  }

  function clearSelections() {
    setSelLine(null)
    setSelLabel(null)
    setSelChips(new Set())
  }
  function setModeSafe(m: Mode) {
    setMode(m)
    clearSelections()
    commitLabelEdit()
  }

  // ── Chip dragging (move mode): one chip, or the whole selected group ───────
  const drag = useRef<{
    key: string; word: WordNodeT; keys: string[]
    startX: number; startY: number
    origs: Record<string, Pos>
    // Delta clamps so no chip in the group leaves the canvas (computed once at grab).
    dxMin: number; dxMax: number; dyMin: number
    moved: boolean
  } | null>(null)

  function onChipDown(e: React.PointerEvent<HTMLDivElement>, w: WordNodeT, key: string) {
    if (readOnly || mode !== 'move' || positions === null) return
    e.preventDefault()
    if (e.shiftKey) {
      // Shift-click toggles membership in the group; no drag starts.
      setSelChips(prev => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key); else next.add(key)
        return next
      })
      return
    }
    // Grabbing a chip inside the selection drags the whole group; grabbing any other
    // chip drops the old group and drags just that chip.
    const group = selChips.has(key) ? Array.from(selChips) : [key]
    if (!selChips.has(key) && selChips.size) setSelChips(new Set())
    const cw = canvasRef.current?.clientWidth ?? 600
    const origs: Record<string, Pos> = {}
    let dxMin = -Infinity, dxMax = Infinity, dyMin = -Infinity
    for (const k of group) {
      const p = positions[k]
      if (!p) continue
      origs[k] = p
      const cwip = chipRefs.current.get(k)?.offsetWidth ?? 40
      dxMin = Math.max(dxMin, -p.x)
      dxMax = Math.min(dxMax, Math.max(0, cw - cwip) - p.x)
      dyMin = Math.max(dyMin, -p.y)
    }
    drag.current = { key, word: w, keys: Object.keys(origs), startX: e.clientX, startY: e.clientY, origs, dxMin, dxMax, dyMin, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onChipMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || positions === null) return
    let dx = e.clientX - d.startX, dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
    d.moved = true
    dx = Math.min(Math.max(dx, d.dxMin), d.dxMax)
    dy = Math.max(dy, d.dyMin)
    const next = { ...positions }
    for (const k of d.keys) next[k] = { x: d.origs[k].x + dx, y: d.origs[k].y + dy }
    setPositions(next)
  }
  function onChipUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (d.moved && positions) persist({ positions, lines, labels })
    else onWord(d.word)   // a click, not a drag → drive the parsing pane, like the tree view
  }

  // ── Label editing / dragging ───────────────────────────────────────────────
  const labelDrag = useRef<{ i: number; startX: number; startY: number; orig: Pos; moved: boolean } | null>(null)

  function commitLabelEdit() {
    if (editLabel === null) return
    const text = editText.trim()
    const next = text
      ? labels.map((l, j) => j === editLabel ? { ...l, text } : l)
      : labels.filter((_, j) => j !== editLabel)   // emptied → remove the label
    setEditLabel(null)
    setEditText('')
    setLabels(next)
    setSelLabel(null)
    if (positions) persist({ positions, lines, labels: next })
  }
  function startLabelEdit(i: number) {
    setEditLabel(i)
    setEditText(labels[i].text)
    setSelLabel(null)
  }
  function onLabelDown(e: React.PointerEvent<HTMLDivElement>, i: number) {
    if (readOnly || mode !== 'move' || positions === null) return
    e.preventDefault()
    labelDrag.current = { i, startX: e.clientX, startY: e.clientY, orig: labels[i], moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onLabelMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = labelDrag.current
    if (!d) return
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
    d.moved = true
    setLabels(ls => ls.map((l, j) => j === d.i ? { ...l, x: Math.max(0, d.orig.x + dx), y: Math.max(0, d.orig.y + dy) } : l))
  }
  function onLabelUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = labelDrag.current
    if (!d) return
    labelDrag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (d.moved && positions) persist({ positions, lines, labels })
    else { setSelLabel(d.i); setSelLine(null); setSelChips(new Set()) }
  }
  function deleteLabel(i: number) {
    const next = labels.filter((_, j) => j !== i)
    setLabels(next)
    setSelLabel(null)
    if (positions) persist({ positions, lines, labels: next })
  }

  // ── Canvas gestures: draw (line mode); place (label mode); marquee / line-move /
  //    reshape (move mode) ──────────────────────────────────────────────────────
  const gesture = useRef<Interaction | null>(null)

  function canvasPoint(e: React.PointerEvent): { x: number; y: number } {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function captureOnCanvas(e: React.PointerEvent) {
    canvasRef.current?.setPointerCapture(e.pointerId)
  }
  function onCanvasDown(e: React.PointerEvent<HTMLDivElement>) {
    if (readOnly) return
    const p = canvasPoint(e)
    if (editLabel !== null) { commitLabelEdit(); return }
    if (mode === 'line' || mode === 'bracket') {
      e.preventDefault()
      gesture.current = { kind: 'draw', ...p, ...(mode === 'bracket' ? { shape: 'bracket' as const } : {}) }
      captureOnCanvas(e)
      return
    }
    if (mode === 'label') {
      e.preventDefault()
      const next = [...labels, { x: p.x, y: p.y, text: '' }]
      setLabels(next)
      setEditLabel(next.length - 1)
      setEditText('')
      return
    }
    // Empty-canvas press: clear selections and start a marquee.
    clearSelections()
    gesture.current = { kind: 'marquee', ...p, moved: false }
    captureOnCanvas(e)
  }
  // A line's body: press to select and start moving the whole line.
  function onLineBodyDown(e: React.PointerEvent, i: number) {
    if (readOnly || mode !== 'move') return
    e.stopPropagation()
    e.preventDefault()
    setSelLine(i)
    setSelLabel(null)
    setSelChips(new Set())
    const p = canvasPoint(e)
    gesture.current = { kind: 'lineBody', i, ...p, orig: lines[i], moved: false }
    captureOnCanvas(e)
  }
  // A selected line's endpoint handle: press to reshape (direction/length).
  function onEndpointDown(e: React.PointerEvent, i: number, end: 1 | 2) {
    if (mode !== 'move') return
    e.stopPropagation()
    e.preventDefault()
    gesture.current = { kind: 'endpoint', i, end, moved: false }
    captureOnCanvas(e)
  }
  function onCanvasMove(e: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g) return
    const p = canvasPoint(e)
    if (g.kind === 'draw') {
      const end = snap ? snap45(g.x, g.y, p.x, p.y) : { x: p.x, y: p.y }
      setPreview({ x1: g.x, y1: g.y, x2: end.x, y2: end.y, shape: g.shape })
    } else if (g.kind === 'marquee') {
      if (!g.moved && Math.hypot(p.x - g.x, p.y - g.y) < 4) return
      g.moved = true
      setMarquee({ x1: g.x, y1: g.y, x2: p.x, y2: p.y })
    } else if (g.kind === 'lineBody') {
      g.moved = true
      const dx = p.x - g.x, dy = p.y - g.y
      setLines(ls => ls.map((l, j) => j === g.i ? { ...l, x1: g.orig.x1 + dx, y1: g.orig.y1 + dy, x2: g.orig.x2 + dx, y2: g.orig.y2 + dy } : l))
    } else {
      g.moved = true
      setLines(ls => ls.map((l, j) => {
        if (j !== g.i) return l
        // Snap around the anchored (non-dragged) end.
        const ax = g.end === 1 ? l.x2 : l.x1, ay = g.end === 1 ? l.y2 : l.y1
        const end = snap ? snap45(ax, ay, p.x, p.y) : { x: p.x, y: p.y }
        return g.end === 1 ? { ...l, x1: end.x, y1: end.y } : { ...l, x2: end.x, y2: end.y }
      }))
    }
  }
  function onCanvasUp(e: React.PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g) return
    gesture.current = null
    const p = canvasPoint(e)
    if (g.kind === 'draw') {
      setPreview(null)
      if (Math.hypot(p.x - g.x, p.y - g.y) < 10) return   // a tap, not a line
      const end = snap ? snap45(g.x, g.y, p.x, p.y) : { x: p.x, y: p.y }
      const next = [...lines, { x1: g.x, y1: g.y, x2: end.x, y2: end.y, ...(g.shape ? { shape: g.shape } : {}) }]
      setLines(next)
      if (positions) persist({ positions, lines: next, labels })
    } else if (g.kind === 'marquee') {
      setMarquee(null)
      if (!g.moved || positions === null) return
      const rx1 = Math.min(g.x, p.x), rx2 = Math.max(g.x, p.x)
      const ry1 = Math.min(g.y, p.y), ry2 = Math.max(g.y, p.y)
      const hit = new Set<string>()
      for (const [key, pos] of Object.entries(positions)) {
        const el = chipRefs.current.get(key)
        const w = el?.offsetWidth ?? 40, h = el?.offsetHeight ?? 40
        if (pos.x < rx2 && pos.x + w > rx1 && pos.y < ry2 && pos.y + h > ry1) hit.add(key)
      }
      setSelChips(hit)
    } else if (g.moved && positions) {
      persist({ positions, lines, labels })
    }
  }
  function deleteLine(i: number) {
    const next = lines.filter((_, j) => j !== i)
    setLines(next)
    setSelLine(null)
    if (positions) persist({ positions, lines: next, labels })
  }
  function setLineStyle(i: number, patch: Partial<Pick<DiagramLine, 'dash' | 'arrow' | 'flip'>>) {
    const next = lines.map((l, j) => j === i ? { ...l, ...patch } : l)
    setLines(next)
    if (positions) persist({ positions, lines: next, labels })
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (editLabel !== null) return   // the input owns the keyboard while editing
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selLine !== null) { e.preventDefault(); deleteLine(selLine) }
      else if (selLabel !== null) { e.preventDefault(); deleteLabel(selLabel) }
    }
    if (e.key === 'Escape') clearSelections()
  }

  function reset() {
    setLines([])
    setLabels([])
    clearSelections()
    setEditLabel(null)
    setPositions(null)   // re-seed from the flow layout on the next render
    persist(null)
  }

  // Canvas grows with the layout so nothing gets clipped below the fold.
  let canvasH = MIN_CANVAS_H
  if (positions) {
    for (const [key, p] of Object.entries(positions)) {
      const el = chipRefs.current.get(key)
      canvasH = Math.max(canvasH, p.y + (el?.offsetHeight ?? 40) + 140)
    }
    for (const l of lines) canvasH = Math.max(canvasH, Math.max(l.y1, l.y2) + 32)
    for (const l of labels) canvasH = Math.max(canvasH, l.y + 56)
  }

  const toolBtn = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${active ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`
  const sel = selLine !== null ? lines[selLine] : null
  const arrowGray = `${uid}-arrow-gray`, arrowBrand = `${uid}-arrow-brand`

  return (
    <div>
      {/* Tool strip: move ⇄ draw ⇄ label, straighten toggle, reset, save status. */}
      {!readOnly && (
      <div className="flex items-center gap-1 mb-2 print:hidden">
        <button type="button" title={t('phr.move')} aria-label={t('phr.move')} aria-pressed={mode === 'move'}
          onClick={() => setModeSafe('move')} className={toolBtn(mode === 'move')}><Move size={16} /></button>
        <button type="button" title={t('phr.drawLines')} aria-label={t('phr.drawLines')} aria-pressed={mode === 'line'}
          onClick={() => setModeSafe('line')} className={toolBtn(mode === 'line')}><Slash size={16} /></button>
        <button type="button" title={t('phr.bracketTool')} aria-label={t('phr.bracketTool')} aria-pressed={mode === 'bracket'}
          onClick={() => setModeSafe('bracket')} className={toolBtn(mode === 'bracket')}><Brackets size={16} /></button>
        <button type="button" title={t('phr.addLabels')} aria-label={t('phr.addLabels')} aria-pressed={mode === 'label'}
          onClick={() => setModeSafe('label')} className={toolBtn(mode === 'label')}><Type size={16} /></button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" title={t('phr.straighten')} aria-label={t('phr.straighten')} aria-pressed={snap}
          onClick={() => setSnap(s => !s)} className={toolBtn(snap)}><Magnet size={15} /></button>
        <button type="button" title={t('phr.toggleGloss')} aria-label={t('phr.toggleGloss')} aria-pressed={showGloss === '1'}
          onClick={() => setShowGloss(showGloss === '1' ? '0' : '1')} className={toolBtn(showGloss === '1')}><Languages size={15} /></button>
        <button type="button" title={t('phr.resetLayout')} aria-label={t('phr.resetLayout')}
          onClick={reset} className={toolBtn(false)}><RotateCcw size={15} /></button>
        <span className={`ml-auto text-xs text-gray-400 transition-opacity ${status === 'saved' ? 'opacity-100' : 'opacity-0'}`}>
          {t('phr.saved')}
        </span>
      </div>
      )}

      <div
        ref={canvasRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        className={`relative w-full rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-300 print:border-gray-300 ${mode === 'line' || mode === 'bracket' ? 'cursor-crosshair' : mode === 'label' ? 'cursor-text' : ''}`}
        style={{ height: canvasH, touchAction: 'none' }}
      >
        {/* Annotation lines under the chips. Hit-testing only in move mode. */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} aria-hidden>
          <defs>
            {/* Two arrowheads (normal + selected): markers can't reliably inherit the
                line's stroke color across the browsers our students use. */}
            <marker id={arrowGray} markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <path d="M0,0 L8,3.5 L0,7 Z" className="fill-gray-500" />
            </marker>
            <marker id={arrowBrand} markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <path d="M0,0 L8,3.5 L0,7 Z" className="fill-brand-600" />
            </marker>
          </defs>
          {lines.map((l, i) => (
            <g key={i}>
              {/* Wide invisible twin so a thin line is actually clickable/draggable. */}
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="transparent" strokeWidth={12}
                style={mode === 'move' ? { pointerEvents: 'stroke', cursor: selLine === i ? 'move' : 'pointer' } : undefined}
                onPointerDown={e => onLineBodyDown(e, i)} />
              {l.shape === 'bracket' ? (
                <path d={bracketPath(l)} fill="none"
                  className={selLine === i ? 'stroke-brand-600' : 'stroke-gray-500'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={l.dash ? '6 4' : undefined} />
              ) : (
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  className={selLine === i ? 'stroke-brand-600' : 'stroke-gray-500'} strokeWidth={2} strokeLinecap="round"
                  strokeDasharray={l.dash ? '6 4' : undefined}
                  markerEnd={l.arrow ? `url(#${selLine === i ? arrowBrand : arrowGray})` : undefined} />
              )}
            </g>
          ))}
          {preview && (preview.shape === 'bracket' ? (
            <path d={bracketPath(preview)} fill="none"
              className="stroke-brand-400" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <line x1={preview.x1} y1={preview.y1} x2={preview.x2} y2={preview.y2}
              className="stroke-brand-400" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
          ))}
          {marquee && (
            <rect x={Math.min(marquee.x1, marquee.x2)} y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)} height={Math.abs(marquee.y2 - marquee.y1)}
              className="fill-brand-100/40 stroke-brand-400" strokeWidth={1} strokeDasharray="4 3" />
          )}
        </svg>

        {/* Endpoint handles for the selected line: drag to change direction and length.
            HTML (not SVG) so they sit ABOVE the word chips — an endpoint that lands under
            a chip must still be grabbable. */}
        {sel && mode === 'move' && ([1, 2] as const).map(end => (
          <div
            key={end}
            onPointerDown={e => onEndpointDown(e, selLine!, end)}
            className="absolute z-10 w-3 h-3 rounded-full bg-brand-600 border-2 border-white shadow cursor-move"
            style={{ left: (end === 1 ? sel.x1 : sel.x2) - 6, top: (end === 1 ? sel.y1 : sel.y2) - 6, touchAction: 'none' }}
          />
        ))}

        {/* Style pill floating above the selected line's midpoint: dashed / arrowhead / delete. */}
        {sel && selLine !== null && (
          <div
            onPointerDown={e => e.stopPropagation()}
            className="absolute z-10 flex items-center gap-0.5 rounded-full bg-popover border border-gray-200 shadow px-1 py-0.5"
            style={{ left: (sel.x1 + sel.x2) / 2 - 44, top: (sel.y1 + sel.y2) / 2 - 34 }}
          >
            <button type="button" title={t('phr.dashedLine')} aria-label={t('phr.dashedLine')} aria-pressed={!!sel.dash}
              onClick={() => setLineStyle(selLine, { dash: !sel.dash })}
              className={`p-1 rounded-full ${sel.dash ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.5" strokeLinecap="round" /></svg>
            </button>
            {sel.shape === 'bracket' ? (
              <button type="button" title={t('phr.flipBracket')} aria-label={t('phr.flipBracket')} aria-pressed={!!sel.flip}
                onClick={() => setLineStyle(selLine, { flip: !sel.flip })}
                className={`p-1 rounded-full ${sel.flip ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                <FlipHorizontal2 size={13} />
              </button>
            ) : (
              <button type="button" title={t('phr.arrowhead')} aria-label={t('phr.arrowhead')} aria-pressed={!!sel.arrow}
                onClick={() => setLineStyle(selLine, { arrow: !sel.arrow })}
                className={`p-1 rounded-full ${sel.arrow ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><line x1="1" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M8,3.5 L13,7 L8,10.5 Z" fill="currentColor" /></svg>
              </button>
            )}
            <button type="button" title={t('phr.deleteLine')} aria-label={t('phr.deleteLine')}
              onClick={() => deleteLine(selLine)}
              className="p-1 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Text labels — function names, relations, supplied (elided) words. */}
        {labels.map((l, i) => editLabel === i ? (
          <input
            key={`edit-${i}`}
            autoFocus
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); commitLabelEdit() } }}
            onBlur={commitLabelEdit}
            onPointerDown={e => e.stopPropagation()}
            placeholder={t('phr.labelPlaceholder')}
            className="absolute z-10 bg-transparent border-b border-brand-400 text-gray-800 italic outline-none placeholder:text-gray-300"
            style={{ left: l.x, top: l.y, width: `${Math.max(6, editText.length + 2)}ch`, fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.55)' }}
          />
        ) : (
          <div
            key={i}
            onPointerDown={e => { e.stopPropagation(); if (mode === 'label') { e.preventDefault(); startLabelEdit(i) } else onLabelDown(e, i) }}
            onPointerMove={onLabelMove}
            onPointerUp={onLabelUp}
            onDoubleClick={() => mode === 'move' && startLabelEdit(i)}
            className={`absolute select-none italic leading-tight text-gray-600 rounded px-0.5 ${readOnly ? '' : mode === 'line' || mode === 'bracket' ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'} ${selLabel === i ? 'ring-1 ring-brand-400 bg-brand-50' : ''}`}
            style={{ left: l.x, top: l.y, touchAction: 'none', fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.55)' }}
          >
            {l.text}
            {selLabel === i && mode === 'move' && (
              <button
                type="button"
                title={t('phr.deleteLabel')}
                aria-label={t('phr.deleteLabel')}
                onPointerDown={e => e.stopPropagation()}
                onClick={() => deleteLabel(i)}
                className="absolute -top-2.5 -right-2.5 z-10 flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white shadow hover:bg-brand-700"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {/* Word chips. Before positions are measured they sit in a normal (hidden) flow
            layout inside the padded box below — the measurement the seeding effect reads. */}
        <div dir={rtl ? 'rtl' : undefined} className={positions === null ? 'p-4 invisible' : 'contents'}>
          {words.map((w, i) => {
            const key = wordKey(w, i)
            const p = positions?.[key]
            const inGroup = selChips.has(key)
            return (
              <div
                key={key}
                ref={el => { if (el) chipRefs.current.set(key, el); else chipRefs.current.delete(key) }}
                onPointerDown={e => { e.stopPropagation(); onChipDown(e, w, key) }}
                onPointerMove={onChipMove}
                onPointerUp={onChipUp}
                onContextMenu={e => {
                  e.preventDefault(); e.stopPropagation()
                  const [b, ch, v] = w.id.split('.')
                  openWordSearch({ x: e.clientX, y: e.clientY, surface: w.w, lemma: w.lemma ?? null, reference: b && ch && v ? `${b} ${ch}:${v}` : undefined, ...(hasHebrew(w.w) ? { kind: 'hebrew' as const } : { kind: 'greek' as const, greekCorpus: 'GNT' as const }) })
                }}
                title={[w.lemma && `lemma: ${w.lemma}`, w.morph && `morph: ${w.morph}`].filter(Boolean).join('\n')}
                className={`${positions === null ? 'inline-flex me-3 mb-2' : 'absolute flex'} flex-col items-start select-none rounded border bg-white px-1.5 py-0.5 shadow-sm ${inGroup ? 'border-brand-500 ring-1 ring-brand-300' : 'border-gray-200'} ${readOnly ? '' : mode === 'move' ? 'cursor-grab active:cursor-grabbing hover:border-brand-300' : 'pointer-events-none'}`}
                style={p ? { left: p.x, top: p.y, touchAction: 'none' } : { touchAction: 'none' }}
              >
                {/* Diagram chips run smaller than the tree's text — the canvas needs the
                    room for lines and labels; the tab's text-size slider still scales them. */}
                <span className={`${hasHebrew(w.w) ? 'font-hebrew' : 'font-greek'} text-gray-900 leading-tight`} style={{ fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.72)' }}>{w.w}</span>
                {w.gloss && showGloss === '1' && <span className="text-gray-400 leading-tight" style={{ fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.45)' }}>{w.gloss}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
