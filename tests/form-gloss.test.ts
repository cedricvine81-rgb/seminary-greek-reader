import fs from 'fs'
import path from 'path'
import { formGloss, isCase, governingCase, FORM_GLOSSED_LEMMAS } from '@/lib/i18n/form-gloss'
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

type Word = { surface: string; lemma: string; morph: Parameters<typeof formatParsing>[0] & { casus?: string | null } }
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
    const ordinary = words('Matt', 6).filter(w => !FORM_GLOSSED_LEMMAS.has(w.lemma.normalize('NFC')))
    expect(ordinary.length).toBeGreaterThan(50)
    expect(ordinary.every(w => glossOf(w) === null)).toBe(true)
  })
})

describe('prepositions take the sense their object requires', () => {
  it('splits διά by case', () => {
    expect(formGloss('διά', 'Preposition', 'Genitive')).toBe('por medio de, a través de')
    expect(formGloss('διά', 'Preposition', 'Accusative')).toBe('a causa de, por')
  })

  it('splits the three-case prepositions', () => {
    expect(formGloss('ἐπί', 'Preposition', 'Dative')).toMatch(/junto a/)
    expect(formGloss('παρά', 'Preposition', 'Genitive')).toBe('de parte de')
  })

  it('falls back to the lemma gloss when the case is unknown', () => {
    // Better the full "(con gen.) …; (con ac.) …" than a guess at which half applies.
    expect(formGloss('διά', 'Preposition', undefined)).toBeNull()
    expect(formGloss('διά', 'Preposition', 'Nominative')).toBeNull()
  })

  it('ignores the person digits the corpus stores in the case field', () => {
    // σου, ἐμοῦ and ἑαυτοῦ are tagged '2', '1', '3' rather than Genitive — roughly a thousand
    // tokens. Reading those as a case would silently mis-sense every preposition before a
    // pronoun, so isCase() requires a real case name.
    expect(isCase('2')).toBe(false)
    expect(isCase('P')).toBe(false)
    expect(isCase('Genitive')).toBe(true)
  })
})

describe('the forward scan, against the real corpus', () => {
  // The SAME function the reader calls, not a copy of it.
  const govern = (ws: Word[], i: number) =>
    governingCase(ws.map(w => ({ lemma: w.lemma, casus: w.morph.casus })), i)

  it('finds the governing case for most prepositions in a chapter', () => {
    const ws = words('Matt', 8)
    const preps = ws.map((w, i) => [w, i] as const).filter(([w]) => w.morph.partOfSpeech === 'Preposition')
    expect(preps.length).toBeGreaterThan(5)
    const found = preps.filter(([, i]) => govern(ws, i)).length
    expect(found / preps.length).toBeGreaterThan(0.8)
  })

  it('reads ἐν as dative and εἰς as accusative wherever it resolves them', () => {
    const ws = words('Matt', 8)
    for (const [w, i] of ws.map((w, i) => [w, i] as const)) {
      if (w.morph.partOfSpeech !== 'Preposition') continue
      const c = govern(ws, i)
      if (!c) continue
      if (w.lemma === 'ἐν') expect(c).toBe('Dative')
      if (w.lemma === 'εἰς') expect(c).toBe('Accusative')
    }
  })
})
