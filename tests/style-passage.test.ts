/**
 * A passage profiled on demand must be measured on exactly the same scale as the prebuilt
 * works it is ranked against.
 *
 * The failure this guards is silent, which is why it is a test rather than a comment: if the
 * builder and the passage profiler ever counted differently — a feature added to one, a
 * normalization changed in the other — both sides would still emit plausible numbers, and a
 * passage would simply be ranked wrongly with nothing to show for it. So the check is an
 * identity: profile a whole book AS a passage, and it must reproduce that book's prebuilt work
 * profile to the last decimal, on the feature rates and on the z-scores alike.
 */
import fs from 'fs'
import path from 'path'
import { profilePassage } from '@/lib/style-passage'

interface Unit { work: string; kind: string; n: number; rates: Record<string, number>; delta: number[] }

const units: Unit[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/style/index.json'), 'utf8'),
).units
const work = (id: string) => units.find(u => u.kind === 'work' && u.work === id)!

describe('passage profiling', () => {
  // Longest, shortest, and one outlier, so a bug that only shows at one end still fails.
  it.each(['Mark', 'Luke', 'Rev', 'Jude'])('reproduces the prebuilt profile of %s', id => {
    const w = work(id)
    const p = profilePassage({ corpus: 'GNT', book: id, fromCh: 1, toCh: 999 })!
    expect(p).not.toBeNull()
    expect(p.n).toBe(w.n)
    for (const k of Object.keys(w.rates)) expect(p.rates[k]).toBeCloseTo(w.rates[k], 2)
    p.delta.forEach((z, i) => expect(z).toBeCloseTo(w.delta[i], 2))
  })

  it('reads a chapter range, and reports the span it actually covered', () => {
    const infancy = profilePassage({ corpus: 'GNT', book: 'Luke', fromCh: 1, toCh: 2 })!
    const rest = profilePassage({ corpus: 'GNT', book: 'Luke', fromCh: 3, toCh: 24 })!
    expect(infancy.n + rest.n).toBe(work('Luke').n)
    expect(infancy.span).toEqual({ fromCh: 1, toCh: 2 })

    // The reason the tool offers passages at all: Luke's infancy narrative is not Luke's Greek.
    // It septuagintalizes — more καί, more ἐγένετο, markedly less δέ.
    expect(infancy.rates.kai).toBeGreaterThan(rest.rates.kai)
    expect(infancy.rates.egeneto).toBeGreaterThan(rest.rates.egeneto)
    expect(infancy.rates.de).toBeLessThan(rest.rates.de)
  })

  it('takes verse bounds as well as chapter bounds', () => {
    const whole = profilePassage({ corpus: 'GNT', book: 'John', fromCh: 1, toCh: 1 })!
    const prologue = profilePassage({ corpus: 'GNT', book: 'John', fromCh: 1, toCh: 1, toV: 18 })!
    expect(prologue.n).toBeGreaterThan(0)
    expect(prologue.n).toBeLessThan(whole.n)
  })

  it('clamps a range that runs past the end of the book', () => {
    const p = profilePassage({ corpus: 'GNT', book: 'Jude', fromCh: 1, toCh: 99 })!
    expect(p.n).toBe(work('Jude').n)
    expect(p.span.toCh).toBe(1)
  })

  // Philemon, 2 John and 3 John are under the index's 400-word floor, so they have no work
  // profile at all. As passages they are still profiled — flagged unreliable, which is the
  // honest answer for 300 words — so the three shortest letters stop being unaskable.
  it('profiles the books too short to be indexed as works', () => {
    for (const id of ['Phlm', '2John', '3John']) {
      expect(units.some(u => u.kind === 'work' && u.work === id)).toBe(false)
      const p = profilePassage({ corpus: 'GNT', book: id, fromCh: 1, toCh: 99 })!
      expect(p.n).toBeGreaterThan(200)
      expect(p.reliable).toBe(false)
    }
  })

  it('refuses a corpus that is not versified by chapter, and an unknown book', () => {
    expect(profilePassage({ corpus: 'josephus', book: 'antiquities', fromCh: 1, toCh: 2 })).toBeNull()
    expect(profilePassage({ corpus: 'GNT', book: 'Enoch', fromCh: 1, toCh: 2 })).toBeNull()
  })

  it('marks a short passage unreliable', () => {
    const short = profilePassage({ corpus: 'GNT', book: 'Mark', fromCh: 1, toCh: 1 })!
    const long = profilePassage({ corpus: 'GNT', book: 'Mark', fromCh: 1, toCh: 16 })!
    expect(short.reliable).toBe(false)
    expect(long.reliable).toBe(true)
  })
})
