import { prisma } from './db'

/* ───────────────────────── Folders ───────────────────────── */

export async function createNoteFolder(userId: string, name: string, color: string) {
  const count = await prisma.noteFolder.count({ where: { userId } })
  return prisma.noteFolder.create({
    data: { userId, name: name.trim() || 'Untitled', color, position: count },
  })
}

export async function updateNoteFolder(userId: string, id: string, data: { name?: string; color?: string }) {
  const folder = await prisma.noteFolder.findUnique({ where: { id }, select: { userId: true } })
  if (!folder || folder.userId !== userId) throw new Error('Folder not found')
  return prisma.noteFolder.update({
    where: { id },
    data: { ...(data.name !== undefined ? { name: data.name.trim() || 'Untitled' } : {}), ...(data.color ? { color: data.color } : {}) },
  })
}

// Deleting a folder leaves its notes intact — they fall back to "Unfiled"
// (folderId is set null by the DB relation's onDelete: SetNull).
export async function deleteNoteFolder(userId: string, id: string) {
  const folder = await prisma.noteFolder.findUnique({ where: { id }, select: { userId: true } })
  if (!folder || folder.userId !== userId) throw new Error('Folder not found')
  await prisma.noteFolder.delete({ where: { id } })
}

/* ───────────────────────── Notes ───────────────────────── */

export async function listNotebook(userId: string) {
  const [folders, notes] = await Promise.all([
    prisma.noteFolder.findMany({
      where: { userId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { notes: true } } },
    }),
    prisma.verseNote.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
  ])
  return { folders, notes }
}

// Notes whose anchor verse falls within a passage (same book + chapter).
export async function notesForPassage(userId: string, book: string, chapter: number, verseStart: number, verseEnd: number) {
  return prisma.verseNote.findMany({
    where: { userId, book, chapter, verse: { gte: verseStart, lte: verseEnd } },
    orderBy: { verse: 'asc' },
  })
}

async function assertFolder(userId: string, folderId: string | null | undefined) {
  if (!folderId) return
  const f = await prisma.noteFolder.findUnique({ where: { id: folderId }, select: { userId: true } })
  if (!f || f.userId !== userId) throw new Error('Folder not found')
}

export async function createNote(userId: string, data: {
  book: string; chapter: number; verse: number; verseEnd?: number | null; body: string; folderId?: string | null
}) {
  await assertFolder(userId, data.folderId)
  return prisma.verseNote.create({
    data: {
      userId, book: data.book, chapter: data.chapter, verse: data.verse,
      verseEnd: data.verseEnd ?? null, body: data.body ?? '', folderId: data.folderId ?? null,
    },
  })
}

export async function updateNote(userId: string, id: string, data: { body?: string; folderId?: string | null }) {
  const note = await prisma.verseNote.findUnique({ where: { id }, select: { userId: true } })
  if (!note || note.userId !== userId) throw new Error('Note not found')
  if (data.folderId !== undefined) await assertFolder(userId, data.folderId)
  return prisma.verseNote.update({
    where: { id },
    data: { ...(data.body !== undefined ? { body: data.body } : {}), ...(data.folderId !== undefined ? { folderId: data.folderId } : {}) },
  })
}

export async function deleteNote(userId: string, id: string) {
  const note = await prisma.verseNote.findUnique({ where: { id }, select: { userId: true } })
  if (!note || note.userId !== userId) throw new Error('Note not found')
  await prisma.verseNote.delete({ where: { id } })
}
