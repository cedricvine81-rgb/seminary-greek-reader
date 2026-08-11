import type { BiblicalBook } from '@/types/biblical-text'
import { bookName, bookAbbrev, hasBookNames } from '@/lib/i18n/book-names'

export interface ParsedRef {
  book: BiblicalBook
  chapter: number
  verse?: number
}

// Common aliases not captured by name/abbrev/osisId
const ALIASES: Record<string, string> = {
  '1co': '1Cor', '2co': '2Cor', '1ti': '1Tim', '2ti': '2Tim',
  '1th': '1Thess', '2th': '2Thess', '1pe': '1Pet', '2pe': '2Pet',
  '1jn': '1John', '2jn': '2John', '3jn': '3John',
  'joh': 'John', 'jn': 'John', 'mt': 'Matt', 'mk': 'Mark',
  'lk': 'Luke', 'ac': 'Acts', 'ro': 'Rom', 'rev': 'Rev',
  'gal': 'Gal', 'eph': 'Eph', 'phi': 'Phil', 'col': 'Col',
  'phm': 'Phlm', 'heb': 'Heb', 'jas': 'Jas', 'jud': 'Jude',
  'gen': 'Gen', 'psa': 'Ps', 'pss': 'Ps', 'psalm': 'Ps', 'psalms': 'Ps',
  'exo': 'Exod', 'deu': 'Deut', 'jos': 'Josh', 'jdg': 'Judg',
  'isa': 'Isa', 'jer': 'Jer', 'eze': 'Ezek', 'dan': 'Dan',
  'mal': 'Mal', 'zec': 'Zech', 'pro': 'Prov',
}

/**
 * `locale` ADDS the localized book name and abbreviation as extra candidates; it never removes
 * the English ones. Two reasons that matters. A Spanish reader must be able to type "Juan 3:16",
 * and the passage pickers build a reference string out of the name they DISPLAY and hand it back
 * here — so localizing a picker without this would break navigation from it. But the English
 * forms have to keep working too: osisIds are English-shaped, saved links and assignment
 * references are English, and a bilingual student types whichever comes to mind.
 */
/**
 * The character class a book name may be built from. Explicit rather than \w, which is
 * [A-Za-z0-9_]: "Génesis 1" failed the regex gate on the é before any name was ever compared,
 * so folding the candidates alone would not have been enough. Covers Latin-1 / Latin Extended-A
 * (Spanish, French, Portuguese), Greek and Cyrillic. Parentheses are allowed INSIDE a name
 * because four books are disambiguated by one — "Esther (Greek)", "Daniel (LXX)" — which never
 * parsed at all before, in English either. No \p{L}: the repo's TS target predates the u flag.
 *
 * Exported because there are TWO reference parsers — this one and parsePassageRef in
 * ExegesisWorkspace, which additionally understands verse RANGES. They had independent copies
 * of this regex and of the candidate list, which is how the same accent bug existed twice.
 */
export const BOOK_CHARS = 'A-Za-z\\u00c0-\\u024f\\u0370-\\u03ff\\u0400-\\u04ff'

/** Fold a book token for comparison: lowercase, strip accents, spaces and parentheses. */
export function foldBookToken(x: string): string {
  return x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s()]+/g, '')
}

/**
 * Resolve a folded book token against a book list, trying exact matches before prefixes.
 * `locale` ADDS the localized name and abbreviation as candidates and never removes the
 * English ones — see parseReference's note on why that has to be additive.
 */
export function findBook(needle: string, books: BiblicalBook[], locale = 'en'): BiblicalBook | undefined {
  const localized = hasBookNames(locale)
  const candidatesFor = (b: BiblicalBook) => {
    const c = [foldBookToken(b.osisId), foldBookToken(b.name), foldBookToken(b.abbrev)]
    if (localized) {
      c.push(foldBookToken(bookName(b.osisId, locale, b.name)), foldBookToken(bookAbbrev(b.osisId, locale, b.abbrev)))
    }
    return c
  }
  return books.find(b => candidatesFor(b).some(c => c === needle))
    ?? books.find(b => {
      const len = Math.max(3, needle.length)
      return candidatesFor(b).some(c => c.startsWith(needle) || needle.startsWith(c.slice(0, len)))
    })
}

export function parseReference(query: string, books: BiblicalBook[], locale = 'en'): ParsedRef | null {
  const q = query.trim()

  // Match: optional-number + word(s) + chapter + optional :verse
  // e.g. "John 3:16", "1 Cor 13:4", "Genesis 1", "Ps 23:1", "Génesis 1", "1 Corintios 13:4"
  const m = q.match(new RegExp(`^((?:\\d\\s*)?[${BOOK_CHARS}][${BOOK_CHARS}\\s()]*?)\\s+(\\d+)(?:\\s*[:.,]\\s*(\\d+))?$`))
  if (!m) return null

  const bookPart = m[1].trim()
  const chapter = parseInt(m[2])
  const verse = m[3] ? parseInt(m[3]) : undefined

  const needle = foldBookToken(bookPart)

  // 1. Check alias map first
  const aliasMatch = ALIASES[needle]
  if (aliasMatch) {
    const book = books.find(b => b.osisId === aliasMatch)
    if (book && chapter >= 1 && chapter <= book.totalChapters) return { book, chapter, verse }
  }

  // 2. Exact matches, then prefixes — shared with parsePassageRef.
  const book = findBook(needle, books, locale)

  if (!book || chapter < 1 || chapter > book.totalChapters) return null
  return { book, chapter, verse }
}
