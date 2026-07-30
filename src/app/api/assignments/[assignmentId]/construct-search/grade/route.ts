import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { getConstructGrading, gradeConstructSubmission, reopenConstructSubmission } from '@/lib/construct-submissions'

// Instructor grading view for a CONSTRUCT_SEARCH assignment: every enrolled student's
// find-list, whether they handed it in, and their grade.
export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(await getConstructGrading(params.assignmentId))
  } catch (err) {
    if (err instanceof Error && err.message === 'Construct search not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    logError('api/assignments/[id]/construct-search/grade GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST { userId, grade?, gradeNote? } — save a grade; { userId, reopen: true } — hand a
// submitted find-list back to that one student.
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

    if (b.reopen === true) {
      await reopenConstructSubmission(params.assignmentId, userId)
      return NextResponse.json({ ok: true })
    }

    const grade = b.grade == null || b.grade === '' ? null : Math.max(0, Math.min(100, Math.round(Number(b.grade))))
    const gradeNote = typeof b.gradeNote === 'string' ? b.gradeNote : null
    const saved = await gradeConstructSubmission(params.assignmentId, userId, { grade, gradeNote })
    return NextResponse.json({ grade: saved.grade, gradeNote: saved.gradeNote })
  } catch (err) {
    logError('api/assignments/[id]/construct-search/grade POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
