/**
 * Reading a typed reference — "Mark", "Luke 1-2", "Mark 4:1-9", "Luke 1:5-2:52".
 *
 * Register used to ask for the book, the corpus and the two chapter numbers in four separate
 * controls, which is four decisions for a thing every student already knows how to write down.
 * This parses what they would write.
 *
 * Kept out of the component so it can be tested without one: a reference that resolves to the
 * wrong chapters produces a plausible ranking of the wrong text, which is exactly the sort of
 * error nobody notices.
 */

export interface RefBook {
  osisId: string
  corpus: string
  name: string
  abbrev?: string
  totalChapters: number
  /**
   * Other spellings that must resolve — above all the book's name in the reader's own
   * language. The placeholder invites a Spanish reader to type "Marcos", so "Marcos" has to
   * work; matching only the English name would have made the box useless in Spanish while
   * looking perfectly fine in English.
   */
  aliases?: string[]
}

export interface ParsedRef {
  book: RefBook
  fromCh: number
  toCh: number
  fromV?: number
  toV?: number
  /** True when the reference names the book alone, so the prebuilt work profile can be used. */
  wholeBook: boolean
}

/** Match how a reader writes a book: case, spaces and full stops are all noise. */
export const normRef = (s: string) => s.toLowerCase().replace(/[\s.]/g, '')

function findBook(books: RefBook[], typed: string): RefBook | null {
  const q = normRef(typed)
  if (!q) return null
  const names = (b: RefBook) => [b.name, ...(b.aliases ?? [])].map(normRef)
  // Exact identity first, then abbreviation, then a prefix — so "Ma" does not beat "Mark" to
  // Matthew merely by appearing earlier in the canon.
  return books.find(b => normRef(b.osisId) === q || names(b).includes(q))
    ?? books.find(b => b.abbrev && normRef(b.abbrev) === q)
    ?? books.find(b => names(b).some(n => n.startsWith(q)) || normRef(b.osisId).startsWith(q))
    ?? null
}

/**
 * Parse a reference against a book list. Returns null when it names nothing.
 *
 * Chapter numbers are clamped to the book: "Luke 1-99" is the whole of Luke rather than an
 * error, which is what someone reaching for the end of a book means.
 */
export function parseReference(value: string, books: RefBook[]): ParsedRef | null {
  const text = value.trim()
  if (!text) return null

  // Split at the first digit that follows a space — everything before it is the book, which
  // may itself begin with one ("1 Corinthians 2").
  const m = /^(.*?)\s+(\d.*)$/.exec(text)
  const bookPart = m ? m[1] : text
  const rest = m ? m[2].trim() : ''

  const book = findBook(books, bookPart)
  if (!book) return null
  const last = book.totalChapters || 1
  const clamp = (n: number) => Math.min(Math.max(1, n), last)

  if (!rest) return { book, fromCh: 1, toCh: last, wholeBook: true }

  // ch | ch-ch | ch:v | ch:v-v | ch:v-ch:v
  const r = /^(\d{1,3})(?::(\d{1,3}))?(?:\s*[-–]\s*(\d{1,3})(?::(\d{1,3}))?)?$/.exec(rest)
  if (!r) return null

  const c1 = clamp(Number(r[1]))
  const v1 = r[2] ? Number(r[2]) : undefined
  const hasEnd = r[3] !== undefined
  const endA = hasEnd ? Number(r[3]) : undefined
  const endB = r[4] ? Number(r[4]) : undefined

  if (!hasEnd) {
    // "Mark 4" is a chapter; "Mark 4:3" is one verse.
    return { book, fromCh: c1, toCh: c1, fromV: v1, toV: v1, wholeBook: false }
  }
  if (endB !== undefined) {
    // "Luke 1:5-2:52" — the second number pair is a chapter and verse.
    return { book, fromCh: c1, toCh: clamp(endA!), fromV: v1, toV: endB, wholeBook: false }
  }
  if (v1 !== undefined) {
    // "Mark 4:1-9" — the end is a verse in the same chapter.
    return { book, fromCh: c1, toCh: c1, fromV: v1, toV: endA, wholeBook: false }
  }
  // "Luke 1-2" — a range of chapters.
  const c2 = clamp(endA!)
  return { book, fromCh: Math.min(c1, c2), toCh: Math.max(c1, c2), wholeBook: false }
}

/** How a parsed reference should read back to the reader, in their own book names. */
export function formatReference(p: ParsedRef, bookLabel: string): string {
  if (p.wholeBook) return bookLabel
  const start = p.fromV === undefined ? `${p.fromCh}` : `${p.fromCh}:${p.fromV}`
  if (p.fromCh === p.toCh && p.fromV === p.toV) return `${bookLabel} ${start}`
  const end = p.toCh === p.fromCh
    ? (p.toV === undefined ? '' : `${p.toV}`)
    : (p.toV === undefined ? `${p.toCh}` : `${p.toCh}:${p.toV}`)
  return end ? `${bookLabel} ${start}–${end}` : `${bookLabel} ${start}`
}
