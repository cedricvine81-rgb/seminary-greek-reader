import fs from 'fs'
import path from 'path'
import { LSJ_CORRECTIONS, lsjGlossFor } from '@/lib/lsj-corrections'

const lsj: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/lsj.json'), 'utf8'),
)

describe('LSJ gloss corrections', () => {
  // The point of the table is to override a known-bad import. If lsj.json is ever rebuilt from
  // a real Liddell–Scott source these assertions fail, which is the signal to re-audit rather
  // than to keep overriding a lexicon that may now be correct.
  it.each(LSJ_CORRECTIONS.map(c => [c.key, c] as const))(
    'still overrides a stale entry for %s', (key, c) => {
      expect(lsj[key]).toBe(c.was)
    })

  it('serves the correction rather than the file', () => {
    for (const c of LSJ_CORRECTIONS) {
      expect(lsjGlossFor(c.key, lsj)).toBe(c.gloss)
      expect(lsjGlossFor(c.key, lsj)).not.toBe(lsj[c.key])
    }
  })

  it('passes uncorrected keys straight through', () => {
    // θεός and λόγος are harvested correctly and must not be touched.
    expect(lsjGlossFor('θεοσ', lsj)).toBe(lsj['θεοσ'])
    expect(lsjGlossFor('λογοσ', lsj)).toBe(lsj['λογοσ'])
    expect(lsjGlossFor('not-a-key', lsj)).toBeNull()
  })

  it('corrects no key twice', () => {
    const keys = LSJ_CORRECTIONS.map(c => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('gives every correction a reason', () => {
    for (const c of LSJ_CORRECTIONS) {
      expect(c.why.length).toBeGreaterThan(20)
      expect(c.gloss.trim()).not.toBe('')
    }
  })
})
