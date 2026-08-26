import fs from 'fs'
import path from 'path'
import { parseReference, findBook, foldBookToken } from '@/lib/parseReference'
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

describe('findBook — the matcher both parsers share', () => {
  // parseReference and ExegesisWorkspace's parsePassageRef (which also understands verse
  // ranges) each used to carry their own copy of this matching, and so each carried its own
  // copy of the accent bug. They now import findBook/foldBookToken/BOOK_CHARS from one place;
  // these cases pin the behaviour that both rely on.
  const find = (q: string, loc?: string) => findBook(foldBookToken(q), BOOKS, loc)?.osisId ?? null

  it('matches English in any locale', () => {
    expect(find('Matthew', 'es')).toBe('Matt')
    expect(find('1 Corinthians', 'es')).toBe('1Cor')
  })
  it('matches Spanish only when asked', () => {
    expect(find('Mateo', 'es')).toBe('Matt')
    expect(find('Mateo', 'en')).toBeNull()
  })
  it('folds accents, spaces and parentheses', () => {
    expect(find('Génesis', 'es')).toBe('Gen')
    expect(find('genesis', 'es')).toBe('Gen')
    expect(find('1Corintios', 'es')).toBe('1Cor')
    expect(find('Daniel (LXX)', 'en')).not.toBeNull()
  })
})

/**
 * Staying in the corpus the reader is already showing.
 *
 * Four Old Testament books carry a different osisId in each edition — Josh/JoshB, Judg/JudgB,
 * Esth/EsthGr, Dan/DanLXX — and the reader resolves against the active corpus first so a jump
 * does not throw the reader into the other one.
 *
 * Daniel is the case that actually broke. Three of the four share a plain name across editions
 * ("Joshua", "Judges") or fail to match either exactly, so an unfiltered lookup lands on the
 * Septuagint by list order and looks fine. But the Septuagint's Daniel is named "Daniel (LXX)",
 * which folds to "daniellxx" — so "Daniel 6" EXACT-matches the Hebrew book and nothing else,
 * and a reader on the Septuagint was bounced to Hebrew on every jump.
 *
 * These assert the filtered lookup the reader performs, which is what makes that a non-issue.
 */
describe('parseReference — resolving within the corpus on screen', () => {
  const within = (corpus: string, q: string) =>
    parseReference(q, BOOKS.filter(b => b.corpus === corpus))?.book.osisId ?? null

  it.each([
    ['LXX', 'Daniel 6', 'DanLXX'],
    ['MT',  'Daniel 6', 'Dan'],
    ['LXX', 'Esther 5', 'EsthGr'],
    ['MT',  'Esther 5', 'Esth'],
    ['LXX', 'Joshua 1', 'JoshB'],
    ['MT',  'Joshua 1', 'Josh'],
    ['LXX', 'Judges 4', 'JudgB'],
    ['MT',  'Judges 4', 'Judg'],
  ])('%s + "%s" resolves to %s', (corpus, q, expected) => {
    expect(within(corpus, q)).toBe(expected)
  })

  it('still finds the chapter, not just the book', () => {
    expect(parseReference('Daniel 6', BOOKS.filter(b => b.corpus === 'LXX'))?.chapter).toBe(6)
  })

  // The fallback: a New Testament reference typed while the Septuagint is showing matches
  // nothing in the LXX list, so the reader drops through to the full list and changes corpus.
  it('returns nothing for a reference outside the active corpus, so the caller can fall back', () => {
    expect(within('LXX', 'John 3:16')).toBeNull()
    expect(parseReference('John 3:16', BOOKS)?.book.osisId).toBe('John')
  })
})
