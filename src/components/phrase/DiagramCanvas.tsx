'use client'
import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Move, Slash, RotateCcw, X } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { openWordSearch } from '@/lib/word-search-bus'
import { hasHebrew } from '@/lib/script-detect'
import { WordCtx, type WordNodeT } from './PhraseExplorer'

// The Diagramming tab's canvas: the sentence's words as freely draggable chips, plus
// hand-drawn annotation lines. One canvas per sentence card; the whole layout round-trips
// as one JSON blob (chip positions keyed by word occurrence + the lines).
export type DiagramLine = { x1: number; y1: number; x2: number; y2: number }
export type DiagramData = { words: Record<string, { x: number; y: number }>; lines: DiagramLine[] }

type Pos = { x: number; y: number }
type Mode = 'move' | 'line'

// A word's key in the layout JSON: id + occurrence index. Hebrew morphemes of one written
// word share an id (בְּ and רֵאשִׁית are both Gen.1.1.1), so the id alone is not unique.
const wordKey = (w: WordNodeT, i: number) => `${w.id}#${i}`

const MIN_CANVAS_H = 260

export function DiagramCanvas({ words, rtl = false, initialData, onSave }: {
  words: WordNodeT[]
  rtl?: boolean
  /** Saved layout to restore, if the user has one for this sentence. */
  initialData?: DiagramData | null
  /** Persist the whole layout; null means "reset" (delete the saved diagram). */
  onSave: (d: DiagramData | null) => Promise<void>
}) {
  const t = useT()
  const { onWord } = useContext(WordCtx)
  const canvasRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // null → chips render in a hidden flow layout first; the layout effect below measures
  // that flow and turns it into absolute positions (so the initial arrangement is exactly
  // what the browser's own line-wrapping produced, LTR or RTL alike).
  const [positions, setPositions] = useState<Record<string, Pos> | null>(null)
  const [lines, setLines] = useState<DiagramLine[]>(initialData?.lines ?? [])
  const [mode, setMode] = useState<Mode>('move')
  const [selLine, setSelLine] = useState<number | null>(null)
  const [preview, setPreview] = useState<DiagramLine | null>(null)
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Seed positions from the measured flow layout, overlaid with any saved positions.
  useLayoutEffect(() => {
    if (positions !== null) return
    const flow: Record<string, Pos> = {}
    words.forEach((w, i) => {
      const el = chipRefs.current.get(wordKey(w, i))
      if (el) flow[wordKey(w, i)] = { x: el.offsetLeft, y: el.offsetTop }
    })
    // Saved positions win; the flow fills in any word the saved layout doesn't know
    // (it shouldn't happen for a stable sentence, but never strand a word off-canvas).
    setPositions({ ...flow, ...(initialData?.words ?? {}) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, words])

  useEffect(() => () => { if (statusTimer.current) clearTimeout(statusTimer.current) }, [])

  function persist(next: { positions: Record<string, Pos>; lines: DiagramLine[] } | null) {
    void onSave(next ? { words: next.positions, lines: next.lines } : null).then(() => {
      setStatus('saved')
      if (statusTimer.current) clearTimeout(statusTimer.current)
      statusTimer.current = setTimeout(() => setStatus('idle'), 1600)
    }).catch(() => {})
  }

  // ── Chip dragging (move mode) ─────────────────────────────────────────────
  const drag = useRef<{ key: string; word: WordNodeT; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)

  function onChipDown(e: React.PointerEvent<HTMLDivElement>, w: WordNodeT, key: string) {
    if (mode !== 'move' || positions === null) return
    e.preventDefault()
    const p = positions[key]
    if (!p) return
    drag.current = { key, word: w, startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onChipMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || positions === null) return
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY
    if (!d.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
    d.moved = true
    const cw = canvasRef.current?.clientWidth ?? 600
    const el = chipRefs.current.get(d.key)
    const w = el?.offsetWidth ?? 40
    setPositions({ ...positions, [d.key]: {
      x: Math.min(Math.max(0, d.origX + dx), Math.max(0, cw - w)),
      y: Math.max(0, d.origY + dy),
    } })
  }
  function onChipUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (d.moved && positions) persist({ positions, lines })
    else onWord(d.word)   // a click, not a drag → drive the parsing pane, like the tree view
  }

  // ── Line drawing (line mode) + selection (move mode) ──────────────────────
  const drawing = useRef<{ x: number; y: number } | null>(null)

  function canvasPoint(e: React.PointerEvent): { x: number; y: number } {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function onCanvasDown(e: React.PointerEvent<HTMLDivElement>) {
    if (mode === 'move') { setSelLine(null); return }
    e.preventDefault()
    drawing.current = canvasPoint(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onCanvasMove(e: React.PointerEvent<HTMLDivElement>) {
    if (mode !== 'line' || !drawing.current) return
    const p = canvasPoint(e)
    setPreview({ x1: drawing.current.x, y1: drawing.current.y, x2: p.x, y2: p.y })
  }
  function onCanvasUp(e: React.PointerEvent<HTMLDivElement>) {
    if (mode !== 'line' || !drawing.current) return
    const start = drawing.current
    drawing.current = null
    setPreview(null)
    const p = canvasPoint(e)
    if (Math.hypot(p.x - start.x, p.y - start.y) < 10) return   // a tap, not a line
    const next = [...lines, { x1: start.x, y1: start.y, x2: p.x, y2: p.y }]
    setLines(next)
    if (positions) persist({ positions, lines: next })
  }
  function deleteLine(i: number) {
    const next = lines.filter((_, j) => j !== i)
    setLines(next)
    setSelLine(null)
    if (positions) persist({ positions, lines: next })
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (selLine !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault()
      deleteLine(selLine)
    }
  }

  function reset() {
    setLines([])
    setSelLine(null)
    setPositions(null)   // re-seed from the flow layout on the next render
    persist(null)
  }

  // Canvas grows with the layout so nothing gets clipped below the fold.
  let canvasH = MIN_CANVAS_H
  if (positions) {
    for (const [key, p] of Object.entries(positions)) {
      const el = chipRefs.current.get(key)
      canvasH = Math.max(canvasH, p.y + (el?.offsetHeight ?? 40) + 48)
    }
    for (const l of lines) canvasH = Math.max(canvasH, Math.max(l.y1, l.y2) + 32)
  }

  const toolBtn = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors ${active ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`
  const sel = selLine !== null ? lines[selLine] : null

  return (
    <div>
      {/* Tool strip: move ⇄ draw, reset, save status. */}
      <div className="flex items-center gap-1 mb-2">
        <button type="button" title={t('phr.move')} aria-label={t('phr.move')} aria-pressed={mode === 'move'}
          onClick={() => setMode('move')} className={toolBtn(mode === 'move')}><Move size={16} /></button>
        <button type="button" title={t('phr.drawLines')} aria-label={t('phr.drawLines')} aria-pressed={mode === 'line'}
          onClick={() => { setMode('line'); setSelLine(null) }} className={toolBtn(mode === 'line')}><Slash size={16} /></button>
        <span className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" title={t('phr.resetLayout')} aria-label={t('phr.resetLayout')}
          onClick={reset} className={toolBtn(false)}><RotateCcw size={15} /></button>
        <span className={`ml-auto text-xs text-gray-400 transition-opacity ${status === 'saved' ? 'opacity-100' : 'opacity-0'}`}>
          {t('phr.saved')}
        </span>
      </div>

      <div
        ref={canvasRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onCanvasDown}
        onPointerMove={onCanvasMove}
        onPointerUp={onCanvasUp}
        className={`relative w-full rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-300 ${mode === 'line' ? 'cursor-crosshair' : ''}`}
        style={{ height: canvasH, touchAction: 'none' }}
      >
        {/* Annotation lines under the chips. Hit-testing only in move mode. */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} aria-hidden>
          {lines.map((l, i) => (
            <g key={i}>
              {/* Wide invisible twin so a thin line is actually clickable. */}
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="transparent" strokeWidth={12}
                style={mode === 'move' ? { pointerEvents: 'stroke', cursor: 'pointer' } : undefined}
                onPointerDown={e => { e.stopPropagation(); setSelLine(i) }} />
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                className={selLine === i ? 'stroke-brand-600' : 'stroke-gray-500'} strokeWidth={2} strokeLinecap="round" />
            </g>
          ))}
          {preview && (
            <line x1={preview.x1} y1={preview.y1} x2={preview.x2} y2={preview.y2}
              className="stroke-brand-400" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" />
          )}
        </svg>

        {/* Delete button floating at the selected line's midpoint. */}
        {sel && (
          <button
            type="button"
            title={t('phr.deleteLine')}
            aria-label={t('phr.deleteLine')}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => selLine !== null && deleteLine(selLine)}
            className="absolute z-10 flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white shadow hover:bg-brand-700"
            style={{ left: (sel.x1 + sel.x2) / 2 - 10, top: (sel.y1 + sel.y2) / 2 - 10 }}
          >
            <X size={12} />
          </button>
        )}

        {/* Word chips. Before positions are measured they sit in a normal (hidden) flow
            layout inside the padded box below — the measurement the seeding effect reads. */}
        <div dir={rtl ? 'rtl' : undefined} className={positions === null ? 'p-4 invisible' : 'contents'}>
          {words.map((w, i) => {
            const key = wordKey(w, i)
            const p = positions?.[key]
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
                className={`${positions === null ? 'inline-flex me-2 mb-1' : 'absolute flex'} flex-col items-start select-none rounded border border-gray-200 bg-white px-1.5 py-0.5 shadow-sm ${mode === 'move' ? 'cursor-grab active:cursor-grabbing hover:border-brand-300' : 'pointer-events-none'}`}
                style={p ? { left: p.x, top: p.y, touchAction: 'none' } : { touchAction: 'none' }}
              >
                <span className={`${hasHebrew(w.w) ? 'font-hebrew' : 'font-greek'} text-gray-900 leading-tight`} style={{ fontSize: 'var(--phrase-fs, 1.45rem)' }}>{w.w}</span>
                {w.gloss && <span className="text-gray-400 leading-tight" style={{ fontSize: 'calc(var(--phrase-fs, 1.45rem) * 0.55)' }}>{w.gloss}</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
