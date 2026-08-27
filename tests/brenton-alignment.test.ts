import fs from 'fs'
import path from 'path'
import { alignBrenton, hasBrentonAlignment, brentonSourceBook } from '@/lib/brenton-alignment'

/**
 * Brenton's verse numbers against Swete's.
 *
 * He translated the Septuagint, but numbered his English the way the KJV Apocrypha does, and
 * Swete numbered the Greek his own way. Since the reader pairs the two columns by verse id, the
 * disagreement showed as an English column quietly reporting a different sentence from the Greek
 * beside it — Tobit 5:14 printed Raguel on Ananias and Jathan against "what wages shall I give
 * thee? wilt thou a drachm a day".
 *
 * The shape is always the same: a verse the Greek numbers and Brenton does not, after which he
 * runs one behind. So the verses BEFORE the divergence must be left alone — a whole-chapter
 * offset would break the ones that already work — and the unnumbered verse must end up with no
 * English rather than with its neighbour's.
 */
const brenton = (osis: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/brenton', `${osis}.json`), 'utf8'))

describe('Brenton alignment', () => {
  it('leaves books it knows nothing about exactly as they are', () => {
    const raw = { 'Jdt.1.1': 'a', 'Jdt.1.2': 'b' }
    expect(alignBrenton('Jdt', raw)).toBe(raw)
    expect(hasBrentonAlignment('Jdt')).toBe(false)
  })

  it('pairs Tobit 5:14 with Raguel speaking, not with the wages', () => {
    const out = alignBrenton('Tob', brenton('Tob'))
    expect(out['Tob.5.14']).toMatch(/welcome, brother/i)
    expect(out['Tob.5.14']).not.toMatch(/drachm/i)
  })

  it('leaves the verses before the divergence alone', () => {
    const raw = brenton('Tob')
    const out = alignBrenton('Tob', raw)
    for (const v of [1, 5, 8]) expect(out[`Tob.5.${v}`]).toBe(raw[`Tob.5.${v}`])
  })

  it('gives the verse Brenton never numbered no English at all', () => {
    const out = alignBrenton('Tob', brenton('Tob'))
    expect(out['Tob.5.9']).toBeUndefined()   // εἰσελθὼν εἶπεν τῷ πατρί
    expect(out['Tob.6.1']).toBeUndefined()   // καὶ ἐπαύσατο κλαίουσα
  })

  it('shifts the rest of Tobit 5 and 6 by one', () => {
    const raw = brenton('Tob')
    const out = alignBrenton('Tob', raw)
    expect(out['Tob.5.10']).toBe(raw['Tob.5.9'])
    expect(out['Tob.6.2']).toBe(raw['Tob.6.1'])
  })

  it('moves the Epistle of Jeremiah up by one, superscription included', () => {
    const raw = brenton('EpJer')
    const out = alignBrenton('EpJer', raw)
    expect(out['EpJer.1.0']).toMatch(/copy of an epistle/i)
    expect(out['EpJer.1.1']).toBe(raw['EpJer.1.2'])
    expect(out['EpJer.1.70']).toBe(raw['EpJer.1.71'])
  })

  it('handles 4 Maccabees 8, where the first and last Greek verses have no English', () => {
    const raw = brenton('4Macc')
    const out = alignBrenton('4Macc', raw)
    expect(out['4Macc.8.1']).toBeUndefined()
    expect(out['4Macc.8.2']).toBe(raw['4Macc.8.1'])
    expect(out['4Macc.8.28']).toBe(raw['4Macc.8.27'])
    expect(out['4Macc.8.29']).toBeUndefined()
  })

  it('does not invent English where Brenton has none', () => {
    const out = alignBrenton('Tob', brenton('Tob'))
    for (const [, text] of Object.entries(out)) expect(typeof text).toBe('string')
  })

  /**
   * Brenton translated Theodotion for Susanna and Bel — his Susanna has 64 verses where the Old
   * Greek has 43 — so his English belongs beside the Theodotion text, under its name.
   */
  describe('Theodotion Susanna and Bel', () => {
    it('reads Brenton out of the file he actually filed it under', () => {
      expect(brentonSourceBook('SusTh')).toBe('Sus')
      expect(brentonSourceBook('BelTh')).toBe('Bel')
      expect(brentonSourceBook('Tob')).toBe('Tob')
    })

    it('re-keys Susanna into the Theodotion book, verse for verse', () => {
      const raw = brenton('Sus')
      const out = alignBrenton('SusTh', raw)
      expect(out['SusTh.1.1']).toBe(raw['Sus.1.1'])
      expect(out['SusTh.1.64']).toBe(raw['Sus.1.64'])
      expect(Object.keys(out)).toHaveLength(Object.keys(raw).length)
      expect(out['Sus.1.1']).toBeUndefined()
    })

    it('leaves the Old Greek reading its own file unchanged', () => {
      const raw = brenton('Sus')
      expect(alignBrenton('Sus', raw)).toBe(raw)
    })

    it('carries Bel across too', () => {
      const raw = brenton('Bel')
      const out = alignBrenton('BelTh', raw)
      expect(out['BelTh.1.1']).toMatch(/Astyages/)
      expect(out['BelTh.1.36']).toMatch(/angel of the Lord/i)
    })
  })
})
