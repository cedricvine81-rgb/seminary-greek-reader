/**
 * Handwritten ink on a note: the stroke model, its wire format, and the one draw routine
 * that both the live pad and every replay use.
 *
 * WHY INK AT ALL, when iPadOS Scribble already writes text into the note box for free: because
 * Scribble does not know Greek or Hebrew. Drawing a ς, a final ך, or the vowel points under a
 * word is exactly what a language student wants to do in a margin, and it is the one thing
 * handwriting can do here that typing cannot.
 *
 * The trade-off is permanent and worth stating plainly: ink is a picture. Master Search cannot
 * find it, an instructor grading a notes folder cannot read it as text, and no translation
 * layer touches it. So ink is an EXTRA layer on a note, never the only place a note lives.
 */

/** One continuous stroke. `pts` is flat — [x, y, pressure, x, y, pressure, …] — because a
 *  stroke runs to a few hundred points and an array of objects triples the stored JSON. */
export interface InkStroke {
  color: string
  /** Nib width in capture-space pixels, before pressure modulates it. */
  size: number
  pts: number[]
}

/** A drawing plus the pad size it was captured at, so a replay at any width scales exactly. */
export interface InkDrawing {
  w: number
  h: number
  strokes: InkStroke[]
}

export const EMPTY_INK: InkDrawing = { w: 0, h: 0, strokes: [] }

export const isEmptyInk = (d: InkDrawing | null): boolean => !d || d.strokes.length === 0

/** Coordinates are rounded to a tenth of a pixel: far finer than a nib, and it roughly halves
 *  the stored size against full float precision. */
const round = (n: number) => Math.round(n * 10) / 10

export function serializeInk(d: InkDrawing): string {
  if (isEmptyInk(d)) return ''
  return JSON.stringify({
    w: Math.round(d.w),
    h: Math.round(d.h),
    strokes: d.strokes.map(s => ({
      color: s.color,
      size: s.size,
      pts: s.pts.map((n, i) => (i % 3 === 2 ? Math.round(n * 100) / 100 : round(n))),
    })),
  })
}

/**
 * Tolerant by design: this JSON comes back from a column that outlives the code that wrote
 * it. A drawing that cannot be understood renders as no drawing, which is recoverable —
 * throwing here would take the whole note pane down with it.
 */
export function parseInk(raw: string | null | undefined): InkDrawing | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw)
    if (!d || typeof d !== 'object' || !Array.isArray(d.strokes)) return null
    const strokes: InkStroke[] = []
    for (const s of d.strokes) {
      if (!s || !Array.isArray(s.pts) || s.pts.length < 3) continue
      if (s.pts.some((n: unknown) => typeof n !== 'number' || !Number.isFinite(n))) continue
      strokes.push({
        color: typeof s.color === 'string' ? s.color : '#1f2937',
        size: typeof s.size === 'number' && s.size > 0 ? s.size : 2,
        // Trim to a whole number of triples so a truncated write can't shift every point.
        pts: s.pts.slice(0, s.pts.length - (s.pts.length % 3)),
      })
    }
    const w = typeof d.w === 'number' && d.w > 0 ? d.w : 0
    const h = typeof d.h === 'number' && d.h > 0 ? d.h : 0
    return strokes.length ? { w, h, strokes } : null
  } catch {
    return null
  }
}

/** Pressure → nib width. Pointer events report 0 for hardware that has no pressure (and 0.5
 *  for a mouse), so a 0 must read as "no information", not as "infinitely fine". */
export function nibWidth(size: number, pressure: number): number {
  const p = pressure > 0 ? pressure : 0.5
  return size * (0.45 + 1.1 * p)
}

/**
 * Draw a whole drawing into a 2D context, scaled to `scale`.
 *
 * One routine for the live pad and every replay, so what is saved is exactly what was drawn.
 * Width is applied per SEGMENT rather than per stroke, which is what makes an Apple Pencil
 * line taper the way the hand expects; a single path can carry only one width.
 */
export function drawInk(ctx: CanvasRenderingContext2D, d: InkDrawing, scale = 1): void {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const s of d.strokes) {
    ctx.strokeStyle = s.color
    const n = s.pts.length / 3
    if (n === 1) {
      // A dot — a tap with no movement. Without this, an i's dot or a dagesh vanishes.
      ctx.fillStyle = s.color
      ctx.beginPath()
      ctx.arc(s.pts[0] * scale, s.pts[1] * scale, (nibWidth(s.size, s.pts[2]) / 2) * scale, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    for (let i = 0; i < n - 1; i++) {
      const [x1, y1, p1] = [s.pts[i * 3], s.pts[i * 3 + 1], s.pts[i * 3 + 2]]
      const [x2, y2, p2] = [s.pts[i * 3 + 3], s.pts[i * 3 + 4], s.pts[i * 3 + 5]]
      ctx.beginPath()
      ctx.lineWidth = nibWidth(s.size, (p1 + p2) / 2) * scale
      ctx.moveTo(x1 * scale, y1 * scale)
      ctx.lineTo(x2 * scale, y2 * scale)
      ctx.stroke()
    }
  }
}

/** The ink's bounding box in capture space, for cropping a preview to what was actually drawn. */
export function inkBounds(d: InkDrawing): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of d.strokes) {
    for (let i = 0; i < s.pts.length; i += 3) {
      const pad = nibWidth(s.size, s.pts[i + 2]) / 2
      minX = Math.min(minX, s.pts[i] - pad); maxX = Math.max(maxX, s.pts[i] + pad)
      minY = Math.min(minY, s.pts[i + 1] - pad); maxY = Math.max(maxY, s.pts[i + 1] + pad)
    }
  }
  if (!Number.isFinite(minX)) return null
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
