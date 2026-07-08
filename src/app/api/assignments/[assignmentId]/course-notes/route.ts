import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { compareStudentsByName } from '@/lib/sort-students'
import { sanitizeNoteHtml, toNoteHtml } from '@/lib/note-html'
import { getAllBooks } from '@/lib/reader'
import { PROSE_WORKS } from '@/lib/prose-texts'

// osisId → display name across every corpus a verse note can be anchored to
// (GNT/LXX/NA1904 + the embedded prose works), so the grading view shows real
// references. Unknown ids fall back to the raw osisId.
function buildBookNames(): Map<string, string> {
  const m = new Map<string, string>()
  for (const b of getAllBooks()) m.set(b.osisId, b.name)
  for (const w of PROSE_WORKS) m.set(w.noteBook, w.name)
  return m
}

// A verse note's human reference, e.g. "John 1:1" or "1 Enoch 1:1–3". Null for a
// general (verse-less) course note.
function noteRef(names: Map<string, string>, n: { book: string | null; chapter: number | null; verse: number | null; verseEnd: number | null }): string | null {
  if (!n.book || n.chapter == null || n.verse == null) return null
  const name = names.get(n.book) ?? n.book
  return `${name} ${n.chapter}:${n.verse}${n.verseEnd ? `–${n.verseEnd}` : ''}`
}

// GET /api/assignments/[assignmentId]/course-notes — instructor grading view: every
// enrolled student with their submission status and the live notes in their submission
// folder. Notes stay editable, so this always reflects the folder's current contents.
export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      select: { id: true, type: true, courseId: true, title: true, notesFolderName: true },
    })
    if (!assignment || assignment.type !== 'COURSE_NOTES') return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: assignment.courseId, status: 'APPROVED', user: { deletedAt: null } },
      include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    })
    enrollments.sort((a, b) => compareStudentsByName(a.user, b.user))
    const studentIds = enrollments.map(e => e.user.id)

    const [submissions, folders] = await Promise.all([
      prisma.noteSubmission.findMany({
        where: { assignmentId: assignment.id, userId: { in: studentIds } },
        select: { userId: true, submittedAt: true, grade: true, gradeNote: true },
      }),
      prisma.noteFolder.findMany({
        where: { assignmentId: assignment.id, userId: { in: studentIds } },
        select: { id: true, userId: true },
      }),
    ])
    const folderByUser = new Map(folders.map(f => [f.userId, f.id]))
    const folderIds = folders.map(f => f.id)

    // All notes across every student's submission folder, in one query.
    const notes = folderIds.length
      ? await prisma.verseNote.findMany({
          where: { folderId: { in: folderIds } },
          orderBy: [{ book: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
          select: { userId: true, book: true, chapter: true, verse: true, verseEnd: true, title: true, body: true },
        })
      : []

    const bookNames = buildBookNames()
    const subByUser = new Map(submissions.map(s => [s.userId, s]))
    const rows = enrollments.map(e => {
      const uid = e.user.id
      const s = subByUser.get(uid)
      const mine = notes
        .filter(n => n.userId === uid)
        .map(n => ({
          // ref is null for a general note; title carries its heading instead.
          ref: noteRef(bookNames, n), title: n.title,
          html: sanitizeNoteHtml(toNoteHtml(n.body)),
        }))
      return {
        userId: uid,
        name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
        email: e.user.email,
        folderId: folderByUser.get(uid) ?? null,
        submittedAt: s?.submittedAt?.toISOString() ?? null,
        grade: s?.grade ?? null,
        gradeNote: s?.gradeNote ?? null,
        noteCount: mine.length,
        notes: mine,
      }
    })

    return NextResponse.json({ assignment: { id: assignment.id, title: assignment.title, notesFolderName: assignment.notesFolderName }, rows })
  } catch (err) {
    logError('api/assignments/[id]/course-notes GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST { userId, grade, gradeNote } — save a student's grade (0–100) + feedback.
export async function POST(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const b = await req.json()
    const userId = String(b.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    const grade = b.grade == null || b.grade === '' ? null : Math.max(0, Math.min(100, Math.round(Number(b.grade))))
    const gradeNote = typeof b.gradeNote === 'string' ? b.gradeNote : null

    const folder = await prisma.noteFolder.findUnique({
      where: { userId_assignmentId: { userId, assignmentId: params.assignmentId } }, select: { id: true },
    })
    const saved = await prisma.noteSubmission.upsert({
      where: { userId_assignmentId: { userId, assignmentId: params.assignmentId } },
      update: { grade, gradeNote },
      create: { userId, assignmentId: params.assignmentId, folderId: folder?.id ?? null, grade, gradeNote },
    })
    return NextResponse.json({ grade: saved.grade, gradeNote: saved.gradeNote })
  } catch (err) {
    logError('api/assignments/[id]/course-notes POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
