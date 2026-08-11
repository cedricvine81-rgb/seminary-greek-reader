import fs from 'fs'
import path from 'path'
import { normalizeMorph } from '@/lib/robinson-morph'
import { formatParsing } from '@/lib/morph-formatting'
import { formGloss } from '@/lib/i18n/form-gloss'

/**
 * Tischendorf's unexpanded Robinson codes.
 *
 * The assertions that matter are the two at the bottom, against the real corpus: that no word
 * reaches the parsing line with a bare code in a field, and that the classes this repairs get a
 * form gloss. Both were failing silently — a wrong parsing renders as happily as a right one.
 */
const chapter = (b: string, c: number) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), `public/data/gnt/${b}_${c}.json`), 'utf8'))
type Word = { surface: string; lemma: string; morph: Parameters<typeof normalizeMorph>[0] }
const words = (b: string, c: number): Word[] =>
  chapter(b, c).verses.flatMap((v: { words: Word[] }) => v.words)

describe('the shifted pronoun classes', () => {
  it('reads ὑμῶν as a 2nd person genitive plural, not "casus 2"', () => {
    const m = normalizeMorph({ partOfSpeech: 'Personal Pronoun', casus: '2', number: 'G', gender: 'P' })
    expect(m).toMatchObject({ person: '2', casus: 'Genitive', number: 'Plural' })
    expect(m.gender).toBeUndefined()
  })

  it('reads a reflexive the same way', () => {
    expect(normalizeMorph({ partOfSpeech: 'Reflexive Pronoun', casus: '3', number: 'D', gender: 'S' }))
      .toMatchObject({ person: '3', casus: 'Dative', number: 'Singular' })
  })

  it('takes the possessive case out of the gender slot', () => {
    // σῷ is N-2SDN in Robinson: the number was already expanded, so only the case slid.
    expect(normalizeMorph({ partOfSpeech: 'Possessive Pronoun', casus: '2', number: 'Singular', gender: 'D' }))
      .toMatchObject({ person: '2', casus: 'Dative', number: 'Singular' })
  })

  it('leaves the case out when the source never carried one', () => {
    // Here `gender` holds a real gender, so there is no case to recover. Inventing one would be
    // worse than the gap: a student reads the parsing line as fact.
    const m = normalizeMorph({ partOfSpeech: 'Possessive Pronoun', casus: '1', number: 'Plural', gender: 'Neuter' })
    expect(m.casus).toBeUndefined()
    expect(m).toMatchObject({ person: '1', number: 'Plural', gender: 'Neuter' })
  })
})

describe('codes that were never cases at all', () => {
  it('reads the adverb letter as a degree', () => {
    expect(normalizeMorph({ partOfSpeech: 'Adverb', casus: 'C' })).toMatchObject({ degree: 'Comparative' })
    expect(normalizeMorph({ partOfSpeech: 'Adverb', casus: 'S' })).toMatchObject({ degree: 'Superlative' })
  })

  it('drops the indeclinable markers instead of showing them', () => {
    // Ἰσραήλ is N-PRI — proper, indeclinable. It has no case, number or gender.
    const m = normalizeMorph({ partOfSpeech: 'Noun', casus: 'P', number: 'R', gender: 'I' })
    expect([m.casus, m.number, m.gender, m.degree]).toEqual([undefined, undefined, undefined, undefined])
  })

  it('does not mistake an interrogative or crasis marker for a case', () => {
    expect(normalizeMorph({ partOfSpeech: 'Adverb', casus: 'I' }).casus).toBeUndefined()      // ποῦ
    expect(normalizeMorph({ partOfSpeech: 'Conditional', casus: 'K' }).casus).toBeUndefined() // κἂν
  })
})

describe('the editions that were already correct', () => {
  it('passes an expanded row through untouched', () => {
    const m = { partOfSpeech: 'Noun', casus: 'Dative', number: 'Singular', gender: 'Masculine' }
    expect(normalizeMorph(m)).toMatchObject(m)
  })
})

describe('against the real corpus', () => {
  // Every value that can legitimately appear in one of these fields. A bare Robinson letter
  // reaching the parsing line is the bug, so the test is that none does.
  const LEGAL = new Set([
    'Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative',
    'Singular', 'Plural', 'Masculine', 'Feminine', 'Neuter',
    'Comparative', 'Superlative', '1', '2', '3',
  ])

  it('leaves no bare code in a displayed field', () => {
    const leaks = [...words('Matt', 1), ...words('1Cor', 1), ...words('Rom', 8)]
      .map(w => normalizeMorph(w.morph))
      .flatMap(m => [m.casus, m.number, m.gender, m.degree, m.person])
      .filter((v): v is string => !!v && !LEGAL.has(v))
    expect(Array.from(new Set(leaks))).toEqual([])
  })

  it('gives ἡμῶν the plural gloss the lemma gloss could not', () => {
    // The complaint that started this: a 1st person PLURAL form glossed "yo". On this edition it
    // survived the form-gloss table, because the case never made it out of the corpus.
    const w = words('Matt', 6).find(x => x.surface === 'ἡμῶν')!
    expect(formGloss(w.lemma, formatParsing(normalizeMorph(w.morph)))).toBe('de nosotros, nuestro')
  })

  it('parses ὑμῖν as a dative plural rather than a person digit', () => {
    const w = words('Matt', 5).find(x => x.surface === 'ὑμῖν')!
    const p = formatParsing(normalizeMorph(w.morph))
    expect(p).toMatch(/Plural/)
    expect(p).toMatch(/Dative/)
    expect(formGloss(w.lemma, p)).toBe('les, a ustedes')
  })
})
