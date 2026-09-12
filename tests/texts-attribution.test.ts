/**
 * Attribution must REACH the reader — CC BY-SA sources (Perseus, First1KGreek, CNTR)
 * require it, and the 2026-09 audit found the Texts library computing the credit but
 * never rendering it: TextsReader handed the string to `onAttribution`, and the /texts
 * page didn't pass that prop. Two invariants keep that fixed:
 *
 *   1. every registered prose work carries a real attribution string;
 *   2. TextsReader renders its own Sources & copyright disclosure (it cannot rely on a
 *      parent passing onAttribution — its only standalone mount doesn't).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PROSE_WORKS } from '@/lib/prose-texts'

describe('Texts attribution', () => {
  it('every prose work has a real attribution string', () => {
    const missing = PROSE_WORKS
      .filter(w => !w.attribution || w.attribution.trim().length < 10)
      .map(w => w.source)
    expect(missing).toEqual([])
  })

  it('TextsReader renders the credit itself, not only via onAttribution', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'components', 'texts', 'TextsReader.tsx'), 'utf8')
    // The standalone disclosure: local state fed by the same effect that reports upward.
    expect(src).toMatch(/setAttribution\(assembled\)/)
    expect(src).toMatch(/texts\.sourcesCopyright/)
  })
})
