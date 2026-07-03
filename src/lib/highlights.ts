import { prisma } from './db'
import { DEFAULT_HIGHLIGHT_COLOR } from './highlight-colors'

// Highlights whose anchor verse falls within a passage (same book + chapter).
export async function highlightsForPassage(userId: string, book: string, chapter: number, verseStart: number, verseEnd: number) {
  return prisma.highlight.findMany({
    where: { userId, book, chapter, verse: { gte: verseStart, lte: verseEnd } },
    orderBy: [{ verse: 'asc' }, { startOffset: 'asc' }],
  })
}

export async function createHighlight(userId: string, data: {
  book: string; chapter: number; verse: number; startOffset: number; endOffset: number; color?: string
}) {
  return prisma.highlight.create({
    data: {
      userId, book: data.book, chapter: data.chapter, verse: data.verse,
      startOffset: data.startOffset, endOffset: data.endOffset, color: data.color ?? DEFAULT_HIGHLIGHT_COLOR,
    },
  })
}

export async function updateHighlightColor(userId: string, id: string, color: string) {
  const h = await prisma.highlight.findUnique({ where: { id }, select: { userId: true } })
  if (!h || h.userId !== userId) throw new Error('Highlight not found')
  return prisma.highlight.update({ where: { id }, data: { color } })
}

export async function deleteHighlight(userId: string, id: string) {
  const h = await prisma.highlight.findUnique({ where: { id }, select: { userId: true } })
  if (!h || h.userId !== userId) throw new Error('Highlight not found')
  await prisma.highlight.delete({ where: { id } })
}
