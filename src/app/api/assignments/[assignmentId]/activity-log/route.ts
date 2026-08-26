import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { requireStudentAccess } from '@/lib/subscription'
import { getActivityLogWorkspace, saveActivityLog } from '@/lib/activity-log-submissions'
import type { JWTPayload } from '@/types/auth'

type Auth = { error: NextResponse; payload?: never } | { error?: never; payload: JWTPayload }

// The student's own weekly reports for an ACTIVITY_LOG assignment. Instructors reach this
// too, through Preview as Student — they can read it (their own, always empty) but not
// write, so a preview never leaves work behind.
async function authorize(assignmentId: string): Promise<Auth> {
  const payload = getPayload()
  if (!payload) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const gate = await requireStudentAccess(payload)
  if (gate) return { error: gate }

  if (payload.role === 'INSTRUCTOR') {
    if (!await isAuthorizedForAssignment(assignmentId, payload.sub)) {
      return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
    }
    return { payload }
  }

  // Students must be enrolled in the course the assignment belongs to.
  const enrolled = await prisma.assignment.count({
    where: {
      id: assignmentId,
      isPublished: true,
      course: { enrollments: { some: { userId: payload.sub, status: 'APPROVED' } } },
    },
  })
  if (enrolled === 0) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  return { payload }
}

const NOT_FOUND = 'Activity log assignment not found'

// GET — the activity's requirements and schedule, plus this student's weekly reports.
export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const auth = await authorize(params.assignmentId)
    if (auth.error) return auth.error
    return NextResponse.json(await getActivityLogWorkspace(params.assignmentId, auth.payload.sub))
  } catch (err) {
    if (err instanceof Error && err.message === NOT_FOUND) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    logError('api/assignments/[id]/activity-log GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST { entries, notes } — save the weekly reports. There is no separate hand-in step: the
// log IS the submission and stays editable all run, so unlike the other types this never
// rejects a save as ALREADY_SUBMITTED.
export async function POST(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const auth = await authorize(params.assignmentId)
    if (auth.error) return auth.error
    if (auth.payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Previewing an assignment cannot save work.' }, { status: 403 })
    }

    const b = await req.json()
    const saved = await saveActivityLog(params.assignmentId, auth.payload.sub, {
      entries: b.entries,
      notes: b.notes,
    })
    return NextResponse.json({ submission: saved })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === NOT_FOUND) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (err.message === 'CLOSED') return NextResponse.json({ error: 'This activity log is closed — reports are no longer accepted.' }, { status: 403 })
    }
    logError('api/assignments/[id]/activity-log POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
