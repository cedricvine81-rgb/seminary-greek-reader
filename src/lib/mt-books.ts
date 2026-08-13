// The 39 osisIds of the Hebrew Bible — a static mirror of public/data/books.json's `mt`
// list for client code that needs "is this an OT book?" synchronously, without a fetch.
// If a book is ever added there (it won't be), add it here.
export const MT_OSIS = new Set([
  'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam',
  '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov',
  'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos',
  'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
])

// Name/abbreviation list for parsing user-typed OT references client-side, without a
// fetch. Kept beside MT_OSIS so the two cannot drift.
export interface MTBook { osis: string; name: string; abbr: string[] }
export const MT_BOOK_LIST: MTBook[] = [
  { osis: 'Gen', name: 'Genesis', abbr: ['gn', 'gen'] }, { osis: 'Exod', name: 'Exodus', abbr: ['ex', 'exod'] },
  { osis: 'Lev', name: 'Leviticus', abbr: ['lv', 'lev'] }, { osis: 'Num', name: 'Numbers', abbr: ['nm', 'num'] },
  { osis: 'Deut', name: 'Deuteronomy', abbr: ['dt', 'deut'] }, { osis: 'Josh', name: 'Joshua', abbr: ['jos', 'josh'] },
  { osis: 'Judg', name: 'Judges', abbr: ['jdg', 'judg'] }, { osis: 'Ruth', name: 'Ruth', abbr: ['ru', 'ruth'] },
  { osis: '1Sam', name: '1 Samuel', abbr: ['1sa', '1sam'] }, { osis: '2Sam', name: '2 Samuel', abbr: ['2sa', '2sam'] },
  { osis: '1Kgs', name: '1 Kings', abbr: ['1ki', '1kgs'] }, { osis: '2Kgs', name: '2 Kings', abbr: ['2ki', '2kgs'] },
  { osis: '1Chr', name: '1 Chronicles', abbr: ['1ch', '1chr'] }, { osis: '2Chr', name: '2 Chronicles', abbr: ['2ch', '2chr'] },
  { osis: 'Ezra', name: 'Ezra', abbr: ['ezr', 'ezra'] }, { osis: 'Neh', name: 'Nehemiah', abbr: ['ne', 'neh'] },
  { osis: 'Esth', name: 'Esther', abbr: ['est', 'esth'] }, { osis: 'Job', name: 'Job', abbr: ['jb', 'job'] },
  { osis: 'Ps', name: 'Psalms', abbr: ['ps', 'psa', 'pss'] }, { osis: 'Prov', name: 'Proverbs', abbr: ['pr', 'prov'] },
  { osis: 'Eccl', name: 'Ecclesiastes', abbr: ['ec', 'eccl', 'qoh'] }, { osis: 'Song', name: 'Song of Songs', abbr: ['sg', 'song', 'cant'] },
  { osis: 'Isa', name: 'Isaiah', abbr: ['is', 'isa'] }, { osis: 'Jer', name: 'Jeremiah', abbr: ['je', 'jer'] },
  { osis: 'Lam', name: 'Lamentations', abbr: ['la', 'lam'] }, { osis: 'Ezek', name: 'Ezekiel', abbr: ['eze', 'ezek'] },
  { osis: 'Dan', name: 'Daniel', abbr: ['da', 'dan'] }, { osis: 'Hos', name: 'Hosea', abbr: ['ho', 'hos'] },
  { osis: 'Joel', name: 'Joel', abbr: ['jl', 'joel'] }, { osis: 'Amos', name: 'Amos', abbr: ['am', 'amos'] },
  { osis: 'Obad', name: 'Obadiah', abbr: ['ob', 'obad'] }, { osis: 'Jonah', name: 'Jonah', abbr: ['jon', 'jonah'] },
  { osis: 'Mic', name: 'Micah', abbr: ['mi', 'mic'] }, { osis: 'Nah', name: 'Nahum', abbr: ['na', 'nah'] },
  { osis: 'Hab', name: 'Habakkuk', abbr: ['hab'] }, { osis: 'Zeph', name: 'Zephaniah', abbr: ['zep', 'zeph'] },
  { osis: 'Hag', name: 'Haggai', abbr: ['hag'] }, { osis: 'Zech', name: 'Zechariah', abbr: ['zec', 'zech'] },
  { osis: 'Mal', name: 'Malachi', abbr: ['mal'] },
]

/** Parse "Gen 1:1-5" / "1 Kings 3" against the MT list. Returns null for non-OT refs. */
export function parseMTRef(ref: string): { osis: string; name: string; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const b = m[1].toLowerCase().replace(/\s+/g, '')
  const book = MT_BOOK_LIST.find(x => x.name.toLowerCase().replace(/\s+/g, '') === b || x.osis.toLowerCase() === b
    || x.abbr.includes(b) || x.name.toLowerCase().replace(/\s+/g, '').startsWith(b) || x.osis.toLowerCase().startsWith(b))
  if (!book) return null
  const chapter = parseInt(m[2], 10)
  const verseStart = m[3] ? parseInt(m[3], 10) : 1
  const verseEnd = m[4] ? parseInt(m[4], 10) : (m[3] ? verseStart : 199)
  return { osis: book.osis, name: book.name, chapter, verseStart, verseEnd }
}
