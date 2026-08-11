import fs from 'fs'
import path from 'path'
import { formGloss } from '@/lib/i18n/form-gloss'
import { formatParsing } from '@/lib/morph-formatting'

/**
 * Form-specific glosses for the closed classes.
 *
 * The case that prompted this: ἡμῖν lemmatises to ἐγώ, so a first person PLURAL DATIVE was
 * glossed "yo". Correct about the lemma, useless to a beginner — and worse than useless, because
 * it sits directly beneath a parsing line that says "plural, dativo".
 *
 * These run against the real corpus rather than hand-written morphology, so a change to how
 * parsings are formatted breaks the test rather than silently switching every article back to
 * the lemma gloss.
 */
const chapter = (b: string, c: number) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), `public/data/gnt/${b}_${c}.json`), 'utf8'))

type Word = { surface: string; lemma: string; morph: Parameters<typeof formatParsing>[0] }
function words(book: string, ch: number): Word[] {
  return chapter(book, ch).verses.flatMap((v: { words: Word[] }) => v.words)
}
const glossOf = (w: Word) => formGloss(w.lemma, formatParsing(w.morph))

describe('the case that prompted this', () => {
  it('glosses a 1st person plural dative as "nos", not "yo"', () => {
    expect(formGloss('ἐγώ', 'Personal Pronoun, 1 person, Plural, Dative')).toBe('nos, a nosotros')
  })
  it('still glosses the nominative singular as "yo"', () => {
    expect(formGloss('ἐγώ', 'Personal Pronoun, 1 person, Singular, Nominative')).toBe('yo')
  })
  it('uses ustedes, not vosotros', () => {
    expect(formGloss('σύ', 'Personal Pronoun, 2 person, Plural, Dative')).toBe('les, a ustedes')
  })
})

describe('against the real corpus', () => {
  it('gives every article form a gloss that agrees with its gender and number', () => {
    const arts = words('Matt', 6).filter(w => w.lemma === 'ὁ')
    expect(arts.length).toBeGreaterThan(10)
    for (const a of arts) {
      const g = glossOf(a)
      expect(g).not.toBeNull()
      if (a.morph.number === 'Plural') expect(g).toMatch(/los|las/)
      if (a.morph.number === 'Singular' && a.morph.gender === 'Feminine') expect(g).toMatch(/la\b/)
    }
  })

  it('distinguishes αὐτοῖς from αὐτός', () => {
    const w = words('Matt', 6).find(x => x.surface === 'αὐτοῖς')!
    expect(glossOf(w)).toBe('les, a ellos')
  })

  it('leaves ordinary nouns and verbs to the lexicon', () => {
    // The dictionary form is what a student needs for a word they must look up or learn; only
    // the paradigms where the inflection IS the vocabulary are handled here.
    const ordinary = words('Matt', 6).filter(w => !['ὁ', 'αὐτός', 'ἐγώ', 'σύ', 'οὗτος', 'ἐκεῖνος'].includes(w.lemma))
    expect(ordinary.length).toBeGreaterThan(50)
    expect(ordinary.every(w => glossOf(w) === null)).toBe(true)
  })
})
