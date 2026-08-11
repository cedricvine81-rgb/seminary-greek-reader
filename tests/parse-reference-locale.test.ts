import fs from 'fs'
import path from 'path'
import { parseReference } from '@/lib/parseReference'
import type { BiblicalBook } from '@/types/biblical-text'
import { bookName } from '@/lib/i18n/book-names'

/**
 * Locale-aware reference parsing.
 *
 * The rule under test is ADDITIVE: a locale's book names become extra ways to name a book, and
 * never stop the English ones from working. That matters in both directions —
 *
 *   • a Spanish reader must be able to type "Juan 3:16", and the passage pickers hand back a
 *     reference string built from the name they DISPLAY, so a localized picker depends on this;
 *   • English must keep resolving for every reader, because osisIds are English-shaped and
 *     saved links, shared references and Assignment.reference are all stored in English.
 *
 * Accent folding is covered because "Génesis" and "Genesis" must both work: the é also has to
 * clear the regex gate that decides whether the query looks like a reference at all, which is
 * a separate failure from the name comparison and was missed the first time.
 */
const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/books.json'), 'utf8'))
const BOOKS: BiblicalBook[] = [...d.gnt, ...d.lxx, ...d.mt]

const osis = (q: string, locale?: string) => parseReference(q, BOOKS, locale)?.book.osisId ?? null

describe('parseReference — English is never lost', () => {
  it.each([
    ['John 3:16', 'John'],
    ['Genesis 1', 'Gen'],
    ['1 Cor 13:4', '1Cor'],
    ['Ps 23:1', 'Ps'],
    ['Matthew 5:3', 'Matt'],
    ['Revelation 22', 'Rev'],
  ])('resolves %s in a Spanish interface too', (q, want) => {
    expect(osis(q, 'en')).toBe(want)
    expect(osis(q, 'es')).toBe(want)
  })

  it('defaults to English when no locale is given', () => {
    expect(osis('John 3:16')).toBe('John')
  })
})

describe('parseReference — Spanish book names', () => {
  it.each([
    ['Juan 3:16', 'John'],
    ['Hechos 2:38', 'Acts'],
    ['1 Corintios 13:4', '1Cor'],
    ['Salmos 23:1', 'Ps'],
    ['Apocalipsis 22', 'Rev'],
    ['Cantar de los Cantares 2', 'Song'],
    ['Ap 22', 'Rev'],
    ['Mt 5:3', 'Matt'],
  ])('resolves %s', (q, want) => {
    expect(osis(q, 'es')).toBe(want)
  })

  it.each([
    ['Génesis 1', 'Genesis 1', 'Gen'],
    ['Éxodo 20', 'Exodo 20', 'Exod'],
    ['Gálatas 2:20', 'Galatas 2:20', 'Gal'],
  ])('resolves %s and its unaccented %s alike', (accented, bare, want) => {
    expect(osis(accented, 'es')).toBe(want)
    expect(osis(bare, 'es')).toBe(want)
  })

  it('does not leak Spanish names into an English interface', () => {
    expect(osis('Juan 3:16', 'en')).toBeNull()
  })
})

describe('parseReference — every localized name round-trips', () => {
  // The passage pickers build "<displayed name> <chapter>" and feed it straight back here, so a
  // name that renders but does not parse is a dead button. Checking the whole catalogue rather
  // than samples is what makes localizing a picker safe — it is how the parenthetical LXX names
  // were caught.
  //
  // The assertion is "resolves to a book displaying that same name", not "resolves to the same
  // osisId", because four LXX books are genuine twins of their MT counterparts and share a
  // display name. "Joshua 1" is ambiguous between Josh and JoshB in ENGLISH already; callers
  // disambiguate by filtering the book list by corpus before calling, which is why that is not
  // this function's problem to solve.
  const label = (b: BiblicalBook) => bookName(b.osisId, 'es', b.name)
  it('resolves for every book in the catalogue', () => {
    const dead = BOOKS.filter(b => osis(`${label(b)} 1`, 'es') === null).map(b => `${b.osisId} → "${label(b)}"`)
    expect(dead).toEqual([])
  })
  it('resolves to a book carrying that display name', () => {
    const wrong: string[] = []
    for (const b of BOOKS) {
      const got = osis(`${label(b)} 1`, 'es')
      const gotBook = BOOKS.find(x => x.osisId === got)
      if (!gotBook || label(gotBook) !== label(b)) wrong.push(`${b.osisId} "${label(b)}" → ${got}`)
    }
    expect(wrong).toEqual([])
  })
})

describe('parseReference — parenthetical book names', () => {
  // These four never parsed, in any language: the pre-localization regex gate accepted only
  // [A-Za-z0-9_] and space, so the "(" ended the match. Fixed for English at the same time.
  it.each([
    ['Esther (Greek) 1', 'en'],
    ['Daniel (LXX) 1', 'en'],
    ['Ester (griego) 1', 'es'],
    ['Daniel (LXX) 1', 'es'],
  ])('parses %s in %s', (q, loc) => {
    expect(osis(q, loc)).not.toBeNull()
  })
})
