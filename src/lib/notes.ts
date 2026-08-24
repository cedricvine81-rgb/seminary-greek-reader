import { Prisma } from '@prisma/client'
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
  const folder = await prisma.noteFolder.findUnique({ where: { id }, select: { userId: true, assignmentId: true } })
  if (!folder || folder.userId !== userId) throw new Error('Folder not found')
  // Course Notes folders are provisioned by an instructor's assignment and hold graded
  // work, so they can be renamed/recoloured but not deleted.
  if (folder.assignmentId) throw new Error('COURSE_NOTES_FOLDER')
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

// A note is either verse-anchored (book/chapter/verse present) or "general" — a course/
// thematic note with no verse, carrying an optional title, that still lives in a folder.
export async function createNote(userId: string, data: {
  book?: string | null; chapter?: number | null; verse?: number | null; verseEnd?: number | null
  title?: string | null; body: string; folderId?: string | null; diagram?: unknown
}) {
  await assertFolder(userId, data.folderId)
  return prisma.verseNote.create({
    data: {
      userId,
      book: data.book ?? null, chapter: data.chapter ?? null, verse: data.verse ?? null,
      verseEnd: data.verseEnd ?? null, title: data.title?.trim() || null,
      body: data.body ?? '', folderId: data.folderId ?? null,
      ...(data.diagram != null ? { diagram: data.diagram as Prisma.InputJsonValue } : {}),
    },
  })
}

export async function updateNote(userId: string, id: string, data: {
  title?: string | null; body?: string; folderId?: string | null
  /** undefined = leave unchanged; null = detach; object = set/replace the snapshot. */
  diagram?: unknown
}) {
  const note = await prisma.verseNote.findUnique({ where: { id }, select: { userId: true } })
  if (!note || note.userId !== userId) throw new Error('Note not found')
  if (data.folderId !== undefined) await assertFolder(userId, data.folderId)
  return prisma.verseNote.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title?.trim() || null } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.folderId !== undefined ? { folderId: data.folderId } : {}),
      ...(data.diagram !== undefined ? { diagram: data.diagram === null ? Prisma.DbNull : data.diagram as Prisma.InputJsonValue } : {}),
    },
  })
}

export async function deleteNote(userId: string, id: string) {
  const note = await prisma.verseNote.findUnique({ where: { id }, select: { userId: true } })
  if (!note || note.userId !== userId) throw new Error('Note not found')
  await prisma.verseNote.delete({ where: { id } })
}

/* ─────────────────── Course Notes (graded assignment) ─────────────────── */

// The colour auto-provisioned Course Notes folders get, so they stand out in the notebook.
const COURSE_NOTES_FOLDER_COLOR = 'indigo'

function courseNotesFolderName(a: { notesFolderName: string | null; title: string }): string {
  return (a.notesFolderName || a.title || 'Course Notes').trim() || 'Course Notes'
}

// Idempotently give every APPROVED student in the course a folder linked to this
// COURSE_NOTES assignment. Called when the assignment is published/updated. Existing
// folders are left untouched (empty `update`), so a student's rename/notes are preserved.
export async function ensureCourseNotesFoldersForAssignment(assignmentId: string) {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, type: true, isPublished: true, notesFolderName: true, title: true, courseId: true },
  })
  if (!a || a.type !== 'COURSE_NOTES' || !a.isPublished) return
  const name = courseNotesFolderName(a)
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: a.courseId, status: 'APPROVED', user: { deletedAt: null } },
    select: { userId: true },
  })
  for (const e of enrollments) {
    await prisma.noteFolder.upsert({
      where: { userId_assignmentId: { userId: e.userId, assignmentId: a.id } },
      update: {},
      create: { userId: e.userId, assignmentId: a.id, name, color: COURSE_NOTES_FOLDER_COLOR },
    })
  }
}

export interface CourseNotesEntry {
  assignmentId: string
  title: string
  courseName: string
  folderId: string
  folderName: string
  dueDate: string
  submittedAt: string | null
  grade: number | null
  gradeNote: string | null
}

// For the student Notes page: ensure a folder exists for every published COURSE_NOTES
// assignment in their approved courses (covers late enrollees), then return each one with
// its folder + submission status. The map is keyed by folderId in the caller.
export async function getCourseNotesForStudent(userId: string): Promise<CourseNotesEntry[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: 'APPROVED' },
    select: { courseId: true },
  })
  const courseIds = enrollments.map(e => e.courseId)
  if (courseIds.length === 0) return []

  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds }, type: 'COURSE_NOTES', isPublished: true },
    select: { id: true, title: true, notesFolderName: true, dueDate: true, course: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
  })
  if (assignments.length === 0) return []

  const out: CourseNotesEntry[] = []
  for (const a of assignments) {
    const name = courseNotesFolderName(a)
    const folder = await prisma.noteFolder.upsert({
      where: { userId_assignmentId: { userId, assignmentId: a.id } },
      update: {},
      create: { userId, assignmentId: a.id, name, color: COURSE_NOTES_FOLDER_COLOR },
    })
    const submission = await prisma.noteSubmission.findUnique({
      where: { userId_assignmentId: { userId, assignmentId: a.id } },
      select: { submittedAt: true, grade: true, gradeNote: true },
    })
    out.push({
      assignmentId: a.id,
      title: a.title,
      courseName: a.course.name,
      folderId: folder.id,
      folderName: folder.name,
      dueDate: a.dueDate.toISOString(),
      submittedAt: submission?.submittedAt.toISOString() ?? null,
      grade: submission?.grade ?? null,
      gradeNote: submission?.gradeNote ?? null,
    })
  }
  return out
}

// Student submits (or resubmits) their notes folder for grading. Notes stay editable;
// this just records/refreshes the submission timestamp so the instructor can grade the
// folder's latest state.
export async function submitCourseNotes(userId: string, assignmentId: string) {
  const a = await prisma.assignment.findFirst({
    where: {
      id: assignmentId, type: 'COURSE_NOTES', isPublished: true,
      course: { enrollments: { some: { userId, status: 'APPROVED' } } },
    },
    select: { id: true },
  })
  if (!a) throw new Error('Assignment not found')
  const folder = await prisma.noteFolder.findUnique({
    where: { userId_assignmentId: { userId, assignmentId } }, select: { id: true },
  })
  return prisma.noteSubmission.upsert({
    where: { userId_assignmentId: { userId, assignmentId } },
    update: { submittedAt: new Date(), folderId: folder?.id ?? null },
    create: { userId, assignmentId, folderId: folder?.id ?? null },
  })
}
