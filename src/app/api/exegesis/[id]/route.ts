import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { getPayload } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

// GET /api/exegesis/[id] — load a session
// Students load their own; instructors can load any session linked to their assignment
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await prisma.exegesisSession.findUnique({ where: { id: params.id } })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (payload.role === 'INSTRUCTOR') {
      // Instructor may only view sessions linked to assignments they own
      if (!session.assignmentId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!await isAuthorizedForAssignment(session.assignmentId, payload.sub)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    } else {
      // Students can only see their own sessions
      if (session.userId !== payload.sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (err) {
    logError('api/exegesis/[id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/exegesis/[id] — update annotations (student) or grade (instructor)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const existing = await prisma.exegesisSession.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (payload.role === 'INSTRUCTOR') {
      // The assignment this session belongs to. Legacy "orphan" sessions have no
      // assignmentId yet — the grader (SubmissionViewer) passes it in the body so we
      // can adopt the session (link it) at grade time. This keeps the results GET read-only.
      const targetAssignmentId: string | null = existing.assignmentId ?? (body.assignmentId ?? null)
      if (!targetAssignmentId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!await isAuthorizedForAssignment(targetAssignmentId, payload.sub)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      const { grade, gradeNote, passageGrades } = body
      if (grade !== undefined && grade !== null) {
        const g = Number(grade)
        if (isNaN(g) || g < 0 || g > 100) {
          return NextResponse.json({ error: 'Grade must be between 0 and 100.' }, { status: 400 })
        }
      }

      // Translation exams are graded per passage: { [reference]: 0-100 | null }.
      // The overall session.grade is the rounded average of the entered passage scores
      // (so the gradebook, which reads session.grade, reflects the exam total).
      let examGrade: number | null | undefined = undefined
      let cleanPassageGrades: Record<string, number> | undefined = undefined
      if (passageGrades !== undefined && passageGrades !== null) {
        if (typeof passageGrades !== 'object' || Array.isArray(passageGrades)) {
          return NextResponse.json({ error: 'Invalid passage grades.' }, { status: 400 })
        }
        cleanPassageGrades = {}
        for (const [ref, val] of Object.entries(passageGrades as Record<string, unknown>)) {
          if (val === null || val === '' || val === undefined) continue
          const n = Number(val)
          if (isNaN(n) || n < 0 || n > 100) {
            return NextResponse.json({ error: 'Each passage grade must be between 0 and 100.' }, { status: 400 })
          }
          cleanPassageGrades[ref] = n
        }
        const entered = Object.values(cleanPassageGrades)
        examGrade = entered.length > 0
          ? Math.round(entered.reduce((a, b) => a + b, 0) / entered.length)
          : null
      }

      const updated = await prisma.exegesisSession.update({
        where: { id: params.id },
        data: {
          // Adopt the orphan session if it wasn't yet linked to an assignment
          ...(!existing.assignmentId && { assignmentId: targetAssignmentId }),
          ...(passageGrades !== undefined && { passageGrades: cleanPassageGrades ?? Prisma.JsonNull, grade: examGrade }),
          ...(grade !== undefined && { grade: grade === null ? null : Number(grade) }),
          ...(gradeNote !== undefined && { gradeNote }),
        },
      })

      // Bust the course gradebook page cache so the instructor sees the new grade immediately
      // when they navigate back to the course page via the Next.js Router Cache.
      const assignment = await prisma.assignment.findUnique({
        where: { id: targetAssignmentId },
        select: { courseId: true },
      })
      if (assignment?.courseId) {
        revalidatePath(`/instructor/courses/${assignment.courseId}`)
      }
      // Student can now immediately see their grade; grade-entry page reflects saved state
      revalidatePath(`/student/assignments/${targetAssignmentId}`)
      revalidatePath(`/instructor/assignments/${targetAssignmentId}/grade`)

      return NextResponse.json({ session: updated })
    }

    // Student — can only patch their own session
    if (existing.userId !== payload.sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { annotations, title, startedAt, corrections, verseTranslations, verseCorrections, notes, assignmentId: patchAssignmentId } = body

    // Server-side lock enforcement (the workspace UI also locks these, but the API is
    // the source of truth): once submitted, the work is frozen; Round 1 fields lock
    // after the Round 1 deadline and Round 2 fields after the Round 2 deadline, so a
    // direct API call can't edit work past the deadline or after submitting.
    const submitted = !!existing.submittedAt
    let round1Locked = submitted
    let round2Locked = submitted
    if (existing.assignmentId) {
      const asgn = await prisma.assignment.findUnique({
        where: { id: existing.assignmentId },
        select: { round1Deadline: true, round2Deadline: true },
      })
      const now = new Date()
      if (asgn?.round1Deadline && now > asgn.round1Deadline) round1Locked = true
      if (asgn?.round2Deadline && now > asgn.round2Deadline) round2Locked = true
    }

    const updated = await prisma.exegesisSession.update({
      where: { id: params.id },
      data: {
        ...(annotations !== undefined && !round1Locked && { annotations }),
        ...(verseTranslations !== undefined && !round1Locked && { verseTranslations }),
        ...(corrections !== undefined && !round2Locked && { corrections }),
        ...(verseCorrections !== undefined && !round2Locked && { verseCorrections }),
        ...(notes !== undefined && !submitted && { notes: String(notes) }),
        ...(title && { title }),
        // Only set startedAt once (never overwrite)
        ...(startedAt && !existing.startedAt && { startedAt: new Date(startedAt) }),
        // Allow patching assignmentId if not yet set — validate the assignment exists and student is enrolled
        ...(patchAssignmentId && !existing.assignmentId && await (async () => {
          const asgn = await prisma.assignment.findUnique({
            where: { id: patchAssignmentId },
            select: { courseId: true, type: true },
          })
          if (!asgn || asgn.type !== 'TRANSLATION_EXERCISE') return {}
          const enroll = await prisma.enrollment.findFirst({
            where: { courseId: asgn.courseId, userId: payload.sub, status: 'APPROVED' },
          })
          return enroll ? { assignmentId: patchAssignmentId } : {}
        })()),
      },
    })
    return NextResponse.json({ session: updated })
  } catch (err) {
    logError('api/exegesis/[id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/exegesis/[id] — delete a session (student only, their own)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.exegesisSession.findFirst({
      where: { id: params.id, userId: payload.sub },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.exegesisSession.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/exegesis/[id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
