import { prisma } from './db'
import type { Corpus } from '@/types/biblical-text'

export type SearchCorpus = Corpus | 'BOTH'

export async function searchByGreekWord(query: string, corpus: SearchCorpus, limit = 50) {
  const corpusFilter = corpus === 'BOTH' ? {} : { corpus: corpus as Corpus }

  return prisma.biblicalVerse.findMany({
    where: {
      text: { contains: query, mode: 'insensitive' },
      book: corpusFilter,
    },
    include: { book: { select: { name: true, abbrev: true, corpus: true } } },
    orderBy: [{ book: { name: 'asc' } }, { chapter: 'asc' }, { verse: 'asc' }],
    take: limit,
  })
}

export async function searchByReference(ref: string, corpus: SearchCorpus, limit = 50) {
  const corpusFilter = corpus === 'BOTH' ? {} : { corpus: corpus as Corpus }

  return prisma.biblicalVerse.findMany({
    where: {
      reference: { contains: ref, mode: 'insensitive' },
      book: corpusFilter,
    },
    include: { book: { select: { name: true, abbrev: true, corpus: true } } },
    orderBy: [{ book: { name: 'asc' } }, { chapter: 'asc' }, { verse: 'asc' }],
    take: limit,
  })
}

export async function searchLexicon(query: string, limit = 20) {
  return prisma.lexicalEntry.findMany({
    where: {
      OR: [
        { lexeme: { contains: query, mode: 'insensitive' } },
        { gloss: { contains: query, mode: 'insensitive' } },
        { strongs: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { frequency: 'desc' },
    take: limit,
  })
}
