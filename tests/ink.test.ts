import { serializeInk, parseInk, isEmptyInk, nibWidth, inkBounds, type InkDrawing } from '@/lib/ink'

const drawing: InkDrawing = {
  w: 400, h: 220,
  strokes: [
    { color: '#1f2937', size: 3, pts: [10, 10, 0.4, 20.55, 30.44, 0.6, 40, 50, 0.9] },
    { color: '#b91c1c', size: 1.5, pts: [100, 100, 0.5] },
  ],
}

describe('ink serialization', () => {
  it('round-trips a drawing', () => {
    const back = parseInk(serializeInk(drawing))
    expect(back).not.toBeNull()
    expect(back!.strokes).toHaveLength(2)
    expect(back!.strokes[0].color).toBe('#1f2937')
    expect(back!.w).toBe(400)
    // Coordinates are rounded to a tenth of a pixel — finer than any nib, half the bytes.
    expect(back!.strokes[0].pts[3]).toBe(20.6)
    expect(back!.strokes[0].pts[4]).toBe(30.4)
  })

  it('serializes an empty drawing to the empty string, not "{}"', () => {
    // The API treats '' as "erased" and writes NULL. A drawing with no strokes has to reach
    // it as '', or clearing the pad would save an empty-but-present drawing forever.
    expect(serializeInk({ w: 400, h: 220, strokes: [] })).toBe('')
  })

  it('returns null rather than throwing on anything unreadable', () => {
    // This JSON outlives the code that wrote it. A drawing that can't be understood must
    // render as no drawing; throwing would take the whole note pane down with it.
    expect(parseInk('not json')).toBeNull()
    expect(parseInk('')).toBeNull()
    expect(parseInk(null)).toBeNull()
    expect(parseInk('{"strokes":"nope"}')).toBeNull()
    expect(parseInk('{"strokes":[]}')).toBeNull()
    expect(parseInk('[1,2,3]')).toBeNull()
  })

  it('drops a stroke with a non-finite coordinate instead of drawing to infinity', () => {
    expect(parseInk('{"w":10,"h":10,"strokes":[{"color":"#000","size":2,"pts":[1,null,0.5]}]}')).toBeNull()
  })

  it('trims a truncated point list to whole triples', () => {
    // A short write would otherwise shift every subsequent x/y/pressure by one position and
    // render the stroke as noise.
    const back = parseInk('{"w":10,"h":10,"strokes":[{"color":"#000","size":2,"pts":[1,2,0.5,3,4]}]}')
    expect(back!.strokes[0].pts).toEqual([1, 2, 0.5])
  })

  it('treats a reported pressure of 0 as "no information", not as a vanishing nib', () => {
    // Hardware without pressure reports 0. Taking that literally makes every stroke from a
    // mouse or a basic stylus invisible.
    expect(nibWidth(3, 0)).toBe(nibWidth(3, 0.5))
    expect(nibWidth(3, 1)).toBeGreaterThan(nibWidth(3, 0.2))
  })

  it('bounds the ink including the nib width, so a stroke is not clipped at its own edge', () => {
    const b = inkBounds(drawing)!
    expect(b.x).toBeLessThan(10)
    expect(b.w).toBeGreaterThan(30)
  })

  it('reports emptiness the way the note pane asks', () => {
    expect(isEmptyInk(null)).toBe(true)
    expect(isEmptyInk({ w: 1, h: 1, strokes: [] })).toBe(true)
    expect(isEmptyInk(drawing)).toBe(false)
  })
})
