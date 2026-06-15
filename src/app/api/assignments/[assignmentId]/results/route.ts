import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

/** Parse an assignment reference string (e.g. "John 1:1-5", "1 Cor 13:4–7")
 *  into a passage filter suitable for querying ExegesisSession. */
async function parseAssignmentReference(ref: string): Promise<{
  bookOsisId: string; chapter: number; verseStart: number; verseEnd: number
} | null> {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2])
  const verseStart = m[3] ? parseInt(m[3]) : 1
  const verseEnd = m[4] ? parseInt(m[4]) : verseStart

  // Look up book by matching osisId, name, or abbrev (case-insensitive, whitespace-stripped)
  const books = await prisma.biblicalBook.findMany({ select: { osisId: true, name: true, abbrev: true, totalChapters: true } })
  const book = books.find(b => {
    const candidates = [b.osisId, b.name, b.abbrev].map(s => s.toLowerCase().replace(/\s+/g, ''))
    return candidates.some(s => s === bookPart || s.startsWith(bookPart) || bookPart.startsWith(s.slice(0, Math.max(3, bookPart.length))))
  })
  if (!book) return null

  // Single-chapter books: if only one number is given, treat it as verseStart
  if (book.totalChapters === 1 && !m[3]) {
    return { bookOsisId: book.osisId, chapter: 1, verseStart: chapter, verseEnd: chapter }
  }
  return { bookOsisId: book.osisId, chapter, verseStart, verseEnd }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { courseId: true, type: true, reference: true, questions: { select: { id: true, points: true, prompt: true } } },
  })
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Passage-based translation exercises have no questions and use ExegesisSession for submissions.
  // Question-based translation exercises use the Response table (same as quizzes).
  const isPassageExercise = assignment.type === 'TRANSLATION_EXERCISE' && assignment.questions.length === 0

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: assignment.courseId, status: 'APPROVED' },
    include: { user: { select: { id: true, firstName: true, surname: true, email: true } } },
    // Alphabetical by surname, then first name (gradebook convention).
    orderBy: [{ user: { surname: 'asc' } }, { user: { firstName: 'asc' } }],
  })

  if (isPassageExercise) {
    // Primary: sessions explicitly linked to this assignment
    const linkedSessions = await prisma.exegesisSession.findMany({
      where: {
        assignmentId: params.assignmentId,
        userId: { in: enrollments.map(e => e.user.id) },
      },
      select: { id: true, userId: true, submittedAt: true, grade: true, gradeNote: true,
                bookOsisId: true, chapter: true, verseStart: true, verseEnd: true },
    })

    // Fallback: orphaned sessions (no assignmentId) for the same passage, from the same students.
    // These were created before the assignmentId routing was in place.
    const usersWithLinkedSession = new Set(linkedSessions.map(s => s.userId))
    const usersWithoutSession = enrollments
      .map(e => e.user.id)
      .filter(id => !usersWithLinkedSession.has(id))

    let orphanSessions: typeof linkedSessions = []
    if (usersWithoutSession.length > 0) {
      // Determine the passage to match against.
      // Prefer using a linked session (exact match); fall back to parsing the assignment reference.
      let passageFilter: { bookOsisId: string; chapter: number; verseStart: number; verseEnd: number } | null = null
      if (linkedSessions.length > 0) {
        const ref = linkedSessions[0]
        passageFilter = { bookOsisId: ref.bookOsisId, chapter: ref.chapter, verseStart: ref.verseStart, verseEnd: ref.verseEnd }
      } else if (assignment.reference) {
        // Parse reference string like "John 1:1-5" or "1 Cor 13:4" to get passage details from DB
        const parsed = await parseAssignmentReference(assignment.reference)
        if (parsed) passageFilter = parsed
      }

      if (passageFilter) {
        const pf = passageFilter
        orphanSessions = await prisma.exegesisSession.findMany({
          where: {
            assignmentId: null,
            userId: { in: usersWithoutSession },
            bookOsisId: pf.bookOsisId,
            chapter: pf.chapter,
            verseStart: pf.verseStart,
            verseEnd: pf.verseEnd,
          },
          select: { id: true, userId: true, submittedAt: true, grade: true, gradeNote: true,
                    bookOsisId: true, chapter: true, verseStart: true, verseEnd: true },
          orderBy: { updatedAt: 'desc' },
        })
        // NOTE: orphan sessions are surfaced here for display only — this GET is read-only.
        // They are permanently linked (adopted) lazily when the instructor grades them
        // (see the instructor branch of PATCH /api/exegesis/[id]).
      }
    }

    const sessions = [...linkedSessions, ...orphanSessions]
    const sessionByUser = new Map(sessions.map(s => [s.userId, s]))

    const rows = enrollments.map(e => {
      const uid = e.user.id
      const session = sessionByUser.get(uid)
      const submitted = !!(session?.submittedAt)
      return {
        userId: uid,
        name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
        email: e.user.email,
        attempted: submitted,
        sessionId: session?.id ?? null,
        submittedAt: session?.submittedAt ?? null,
        grade: session?.grade ?? null,
        gradeNote: session?.gradeNote ?? null,
        // quiz fields not applicable
        earned: null,
        totalPoints: null,
        pct: session?.grade ?? null,
      }
    })

    const attempted = rows.filter(r => r.attempted)
    const gradedRows = attempted.filter(r => r.grade !== null)
    const runningPct = gradedRows.length > 0
      ? Math.round(gradedRows.reduce((s, r) => s + (r.grade ?? 0), 0) / gradedRows.length)
      : null

    return NextResponse.json({ rows, totalPoints: null, runningPct, overallPct: null, isTranslation: true })
  }

  // ── Standard quiz / question-based translation exercise ───────────────────
  // Full-pool total (used only as a fallback / for fixed quizzes). For re-sampling
  // vocab quizzes the pool can be the whole frequency section, so each student is
  // scored out of the questions THEY were actually shown (their stored responses).
  const fullTotalPoints = assignment.questions.reduce((s, q) => s + q.points, 0)

  const responses = await prisma.response.findMany({
    where: {
      assignmentId: params.assignmentId,
      userId: { in: enrollments.map(e => e.user.id) },
      questionId: { not: null },
    },
    select: { userId: true, questionId: true, answer: true, isCorrect: true, score: true, question: { select: { points: true } } },
  })

  const rows = enrollments.map(e => {
    const uid = e.user.id
    const userResponses = responses.filter(r => r.userId === uid)
    const attempted = userResponses.length > 0
    const earned = userResponses.reduce((s, r) => s + (r.score ?? 0), 0)
    // Score out of the questions this student was shown, not the whole pool.
    const answeredPts = userResponses.reduce((s, r) => s + (r.question?.points ?? 0), 0)
    const totalPoints = answeredPts || fullTotalPoints
    const pct = attempted && totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : null

    return {
      userId: uid,
      name: [e.user.firstName, e.user.surname].filter(Boolean).join(' ') || e.user.email,
      email: e.user.email,
      attempted,
      earned,
      totalPoints,
      pct,
      sessionId: null,
      submittedAt: null,
      grade: null,
      gradeNote: null,
    }
  })

  const attempted = rows.filter(r => r.attempted)
  const runningPct = attempted.length > 0
    ? Math.round(attempted.reduce((s, r) => s + (r.pct ?? 0), 0) / attempted.length)
    : null
  // overallPct: average only over students who actually attempted (same as runningPct for clarity)
  const overallPct = runningPct
  // Representative total for the header: the per-attempt count students were shown
  // (from an actual attempt) rather than the full pool; fall back to the pool size.
  const totalPoints = attempted[0]?.totalPoints ?? fullTotalPoints

  return NextResponse.json({ rows, totalPoints, runningPct, overallPct, isTranslation: false })

  } catch (err) {
    logError('api/assignments/[assignmentId]/results', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/assignments/[assignmentId]/results?sessionId=xxx
// Instructor un-submits a student's translation-exercise submission: clears the
// submitted state, snapshot, and grade, and removes the sentinel Response so the
// student can finish (e.g. Round 2) and resubmit. The student's work is preserved.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
    }

    const session = await prisma.exegesisSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, assignmentId: true },
    })
    if (!session) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    // Only allow un-submitting a session that belongs to this assignment (or an
    // orphan session that was matched to it by passage).
    if (session.assignmentId && session.assignmentId !== params.assignmentId) {
      return NextResponse.json({ error: 'Submission does not belong to this assignment' }, { status: 403 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      select: { courseId: true },
    })

    await prisma.$transaction([
      prisma.exegesisSession.update({
        where: { id: sessionId },
        data: {
          submittedAt: null,
          submittedAnnotations: Prisma.DbNull,
          grade: null,
          gradeNote: null,
        },
      }),
      prisma.response.deleteMany({
        where: { userId: session.userId, assignmentId: params.assignmentId, questionId: null },
      }),
    ])

    if (assignment) {
      revalidatePath(`/instructor/courses/${assignment.courseId}`)
      revalidatePath(`/instructor/assignments/${params.assignmentId}/grade`)
    }
    revalidatePath('/student/assignments')
    revalidatePath(`/student/assignments/${params.assignmentId}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/assignments/[assignmentId]/results DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
