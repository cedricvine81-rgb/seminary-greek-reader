'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Undo2, Eraser } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { drawInk, nibWidth, type InkDrawing, type InkStroke } from '@/lib/ink'

const PEN_COLORS = ['#1f2937', '#b91c1c', '#1d4ed8', '#15803d'] as const
const PEN_SIZES = [1.5, 3, 6] as const

/**
 * A handwriting surface for a note — for the thing Scribble cannot do: drawing Greek and
 * Hebrew letterforms, accents and vowel points.
 *
 * PALM REJECTION is the whole difficulty of pen input on a tablet, and the honest solution is
 * not a clever heuristic but a stated rule: once this pad has seen a single `pointerType:
 * 'pen'` event it stops accepting touch entirely, so a resting hand draws nothing. Until then
 * a finger draws, because a reader without a stylus must not meet a dead rectangle. The rule
 * is per-pad and resets with it, so picking the Pencil up mid-note takes effect immediately.
 */
export function InkPad({ value, onChange, height = 220 }: {
  value: InkDrawing | null
  onChange: (d: InkDrawing) => void
  height?: number
}) {
  const t = useT()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [color, setColor] = useState<string>(PEN_COLORS[0])
  const [size, setSize] = useState<number>(PEN_SIZES[1])
  const penSeen = useRef(false)
  // The stroke in progress. Kept in a ref, not state: a stroke takes a point every few
  // milliseconds and re-rendering React on each one would drop points on an older iPad.
  const live = useRef<InkStroke | null>(null)
  const strokes = useRef<InkStroke[]>(value?.strokes ?? [])

  useEffect(() => { strokes.current = value?.strokes ?? [] }, [value])

  /** Repaint everything at device resolution. Cheap enough to do per frame while drawing. */
  const repaint = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const dpr = window.devicePixelRatio || 1
    const w = wrap.clientWidth
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(height * dpr)
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)
    const all = live.current ? [...strokes.current, live.current] : strokes.current
    drawInk(ctx, { w, h: height, strokes: all }, 1)
  }, [height])

  useEffect(() => {
    repaint()
    const ro = new ResizeObserver(repaint)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [repaint, value])

  /** Whether this pointer may draw — see the palm-rejection note above. */
  function accepts(e: React.PointerEvent): boolean {
    if (e.pointerType === 'pen') { penSeen.current = true; return true }
    if (e.pointerType === 'touch') return !penSeen.current
    return true // mouse / trackpad
  }

  function at(e: React.PointerEvent): [number, number, number] {
    const r = canvasRef.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top, e.pressure]
  }

  function onDown(e: React.PointerEvent) {
    if (!accepts(e)) return
    // Capture so a stroke that runs off the pad still ends here rather than being abandoned
    // mid-line, and so the page cannot start scrolling under the hand.
    canvasRef.current?.setPointerCapture(e.pointerId)
    live.current = { color, size, pts: at(e) }
    repaint()
  }

  function onMove(e: React.PointerEvent) {
    if (!live.current || !accepts(e)) return
    // Coalesced events are the difference between a smooth line and a polygon: a Pencil
    // samples far faster than the browser fires pointermove, and the extra points arrive here.
    const events = typeof e.nativeEvent.getCoalescedEvents === 'function'
      ? e.nativeEvent.getCoalescedEvents()
      : [e.nativeEvent]
    const r = canvasRef.current!.getBoundingClientRect()
    for (const ev of events) {
      live.current.pts.push(ev.clientX - r.left, ev.clientY - r.top, ev.pressure)
    }
    repaint()
  }

  function onUp() {
    if (!live.current) return
    strokes.current = [...strokes.current, live.current]
    live.current = null
    commit()
  }

  function commit() {
    const w = wrapRef.current?.clientWidth ?? 0
    onChange({ w, h: height, strokes: strokes.current })
    repaint()
  }

  function undo() {
    strokes.current = strokes.current.slice(0, -1)
    commit()
  }

  function clear() {
    strokes.current = []
    commit()
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        {PEN_COLORS.map(c => (
          <button
            key={c} type="button" onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            aria-label={c}
            className={`h-5 w-5 rounded-full transition-shadow ${color === c ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {PEN_SIZES.map(s => (
          <button
            key={s} type="button" onClick={() => setSize(s)}
            aria-label={String(s)}
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${size === s ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <span className="rounded-full bg-gray-700" style={{ width: nibWidth(s, 0.6), height: nibWidth(s, 0.6) }} />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={undo} title={t('ink.undo')} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <Undo2 size={13} />
          </button>
          <button type="button" onClick={clear} title={t('ink.clear')} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Eraser size={13} />
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="rounded-lg border border-gray-200 bg-surface">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          // touch-action:none is what stops the page scrolling under a drawing finger; without
          // it the first stroke on a tablet scrolls the chapter instead of drawing.
          style={{ height, touchAction: 'none', width: '100%', display: 'block' }}
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">{t('ink.hint')}</p>
    </div>
  )
}
