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
export function parseReference(query: string, books: BiblicalBook[], locale = 'en'): ParsedRef | null {
  const q = query.trim()

  // Match: optional-number + word(s) + chapter + optional :verse
  // e.g. "John 3:16", "1 Cor 13:4", "Genesis 1", "Ps 23:1", "Génesis 1", "1 Corintios 13:4"
  //
  // The letter class is explicit rather than \w because \w is [A-Za-z0-9_]: "Génesis 1" failed
  // this gate outright on the é, before any book name was ever compared, so accent-folding the
  // candidates alone would not have been enough. Ranges cover Latin-1/Latin Extended-A (Spanish,
  // French, Portuguese), Greek and Cyrillic. No \p{L} — the repo's TS target predates the u flag.
  const L = 'A-Za-z\\u00c0-\\u024f\\u0370-\\u03ff\\u0400-\\u04ff'
  // Parentheses are allowed INSIDE the name (never at the start) because four books are
  // disambiguated by a parenthetical: "Esther (Greek)", "Daniel (LXX)". Without this they did
  // not parse AT ALL — in English either, long before any of this was localized — so the Texts
  // and picker paths that build a reference from a displayed name silently dead-ended on them.
  const m = q.match(new RegExp(`^((?:\\d\\s*)?[${L}][${L}\\s()]*?)\\s+(\\d+)(?:\\s*[:.,]\\s*(\\d+))?$`))
  if (!m) return null

  const bookPart = m[1].trim()
  const chapter = parseInt(m[2])
  const verse = m[3] ? parseInt(m[3]) : undefined

  const needle = bookPart.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s()]+/g, '')

  // 1. Check alias map first
  const aliasMatch = ALIASES[needle]
  if (aliasMatch) {
    const book = books.find(b => b.osisId === aliasMatch)
    if (book && chapter >= 1 && chapter <= book.totalChapters) return { book, chapter, verse }
  }

  // 2. Try exact matches then prefix matches
  // Accents are folded so "Génesis" and "Genesis", "Gálatas" and "Galatas" all resolve — a
  // reader typing quickly on a phone should not have to reach for the accent key.
  const fold = (x: string) =>
    x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s()]+/g, '')
  const localized = hasBookNames(locale)
  const candidatesFor = (b: BiblicalBook) => {
    const c = [fold(b.osisId), fold(b.name), fold(b.abbrev)]
    if (localized) { c.push(fold(bookName(b.osisId, locale, b.name)), fold(bookAbbrev(b.osisId, locale, b.abbrev))) }
    return c
  }
  const book = books.find(b => candidatesFor(b).some(c => c === needle))
    ?? books.find(b => {
      const len = Math.max(3, needle.length)
      return candidatesFor(b).some(c => c.startsWith(needle) || needle.startsWith(c.slice(0, len)))
    })

  if (!book || chapter < 1 || chapter > book.totalChapters) return null
  return { book, chapter, verse }
}
