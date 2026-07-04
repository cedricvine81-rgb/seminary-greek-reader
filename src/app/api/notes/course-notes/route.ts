import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { getCourseNotesForStudent, submitCourseNotes } from '@/lib/notes'

// GET: the signed-in student's Course Notes assignments (with auto-provisioned folder +
// submission status). Provisions any missing folders as a side effect.
export async function GET() {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const entries = await getCourseNotesForStudent(payload.sub)
    return NextResponse.json({ entries })
  } catch (err) {
    logError('api/notes/course-notes GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST { assignmentId }: submit (or resubmit) the student's notes folder for grading.
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const b = await req.json()
    if (!b.assignmentId) return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })
    const sub = await submitCourseNotes(payload.sub, String(b.assignmentId))
    return NextResponse.json({ submittedAt: sub.submittedAt })
  } catch (err) {
    logError('api/notes/course-notes POST', err)
    return NextResponse.json({ error: err instanceof Error && err.message === 'Assignment not found' ? err.message : 'Server error.' }, { status: 500 })
  }
}
