/**
 * The pericope headings in Spanish.
 *
 * The catalogue is keyed by a fingerprint of the English title, so its coverage can silently
 * rot in both directions: a retitled section stops matching (by design — the reader gets the
 * new English), and nothing would ever say so. This pins the whole surface: every distinct
 * title in pericopes.json has a fresh Spanish entry, no entry outlives its title, and the
 * catalogue is not merely echoing the English back.
 */
import fs from 'fs'
import path from 'path'
import { fingerprint } from '@/lib/i18n/content'

const pericopes: Record<string, { t: string }[]> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/pericopes.json'), 'utf8'),
)
const es: Record<string, { fp: string; text: string }> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/pericope-titles/es.json'), 'utf8'),
)

const titles = new Set<string>()
for (const secs of Object.values(pericopes)) for (const s of secs) if (s.t?.trim()) titles.add(s.t.trim())

describe('pericope titles in Spanish', () => {
  it('covers every distinct heading', () => {
    const missing = Array.from(titles).filter(t => !es[`peri.${fingerprint(t)}`])
    expect(missing).toEqual([])
  })

  it('carries no entry for a heading that no longer exists', () => {
    const live = new Set(Array.from(titles).map(t => `peri.${fingerprint(t)}`))
    expect(Object.keys(es).filter(k => !live.has(k))).toEqual([])
  })

  it('actually translates rather than echoing', () => {
    const echoed = Array.from(titles).filter(t => {
      const e = es[`peri.${fingerprint(t)}`]
      return e && e.text === t && t.split(' ').length > 1 && !t.startsWith('(')
    })
    expect(echoed).toEqual([])
  })

  it('is spot-on for the headings a class will actually meet', () => {
    const by = (t: string) => es[`peri.${fingerprint(t)}`]?.text
    expect(by('The Parable of the Sower')).toBe('La parábola del sembrador')
    expect(by('The LORD Is My Shepherd')).toBe('El Señor es mi pastor')
    expect(by('The Suffering Servant')).toBe('El siervo sufriente')
    expect(by('The Prodigal Son') ?? by('The Parable of the Prodigal Son')).toBe('La parábola del hijo pródigo')
  })
})
