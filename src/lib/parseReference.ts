import type { BiblicalBook } from '@/types/biblical-text'

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

export function parseReference(query: string, books: BiblicalBook[]): ParsedRef | null {
  const q = query.trim()

  // Match: optional-number + word(s) + chapter + optional :verse
  // e.g. "John 3:16", "1 Cor 13:4", "Genesis 1", "Ps 23:1"
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+))?$/)
  if (!m) return null

  const bookPart = m[1].trim()
  const chapter = parseInt(m[2])
  const verse = m[3] ? parseInt(m[3]) : undefined

  const needle = bookPart.toLowerCase().replace(/\s+/g, '')

  // 1. Check alias map first
  const aliasMatch = ALIASES[needle]
  if (aliasMatch) {
    const book = books.find(b => b.osisId === aliasMatch)
    if (book && chapter >= 1 && chapter <= book.totalChapters) return { book, chapter, verse }
  }

  // 2. Try exact matches then prefix matches
  const book = books.find(b => {
    const candidates = [
      b.osisId.toLowerCase(),
      b.name.toLowerCase().replace(/\s+/g, ''),
      b.abbrev.toLowerCase().replace(/\s+/g, ''),
    ]
    return candidates.some(c => c === needle)
  }) ?? books.find(b => {
    const candidates = [
      b.osisId.toLowerCase(),
      b.name.toLowerCase().replace(/\s+/g, ''),
      b.abbrev.toLowerCase().replace(/\s+/g, ''),
    ]
    const len = Math.max(3, needle.length)
    return candidates.some(c => c.startsWith(needle) || needle.startsWith(c.slice(0, len)))
  })

  if (!book || chapter < 1 || chapter > book.totalChapters) return null
  return { book, chapter, verse }
}
