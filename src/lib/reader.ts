import { prisma } from './db'
import type { Corpus } from '@/types/biblical-text'

export async function getBooks(corpus: Corpus) {
  return prisma.biblicalBook.findMany({
    where: { corpus },
    orderBy: { name: 'asc' },
  })
}

export async function getChapter(bookOsisId: string, chapter: number) {
  const book = await prisma.biblicalBook.findUnique({ where: { osisId: bookOsisId } })
  if (!book) return null

  const verses = await prisma.biblicalVerse.findMany({
    where: { bookId: book.id, chapter },
    orderBy: { verse: 'asc' },
    include: {
      words: {
        orderBy: { position: 'asc' },
        include: {
          lexeme: true,
          parses: true,
        },
      },
    },
  })
  return { book, chapter, verses }
}

export async function getVerse(bookOsisId: string, chapter: number, verse: number) {
  const book = await prisma.biblicalBook.findUnique({ where: { osisId: bookOsisId } })
  if (!book) return null

  return prisma.biblicalVerse.findUnique({
    where: { bookId_chapter_verse: { bookId: book.id, chapter, verse } },
    include: {
      words: {
        orderBy: { position: 'asc' },
        include: { lexeme: true, parses: true },
      },
    },
  })
}

export async function getWordParseInfo(wordId: string) {
  return prisma.verseWord.findUnique({
    where: { id: wordId },
    include: {
      lexeme: true,
      parses: true,
      verse: { include: { book: true } },
    },
  })
}

/** Build a human-readable parsing string from a MorphParse row */
export function formatParsing(parse: {
  partOfSpeech: string
  tense?: string | null; voice?: string | null; mood?: string | null
  person?: string | null; number?: string | null
  casus?: string | null; gender?: string | null; degree?: string | null
}): string {
  const parts: string[] = [parse.partOfSpeech]
  if (parse.tense) parts.push(parse.tense)
  if (parse.voice) parts.push(parse.voice)
  if (parse.mood) parts.push(parse.mood)
  if (parse.person) parts.push(`${parse.person} person`)
  if (parse.number) parts.push(parse.number)
  if (parse.casus) parts.push(parse.casus)
  if (parse.gender) parts.push(parse.gender)
  if (parse.degree) parts.push(parse.degree)
  return parts.join(', ')
}
