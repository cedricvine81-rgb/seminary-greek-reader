import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { requireStudentAccess } from '@/lib/subscription'
import { getConstructWorkspace, saveConstructSubmission } from '@/lib/construct-submissions'
import type { JWTPayload } from '@/types/auth'

type Auth = { error: NextResponse; payload?: never } | { error?: never; payload: JWTPayload }

// The student's own find-list for a CONSTRUCT_SEARCH assignment. Instructors reach this too,
// through Preview as Student — they can read it (their own, always empty) but not write, so a
// preview never leaves work behind.
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

// GET — the assignment's search + settings and this student's saved work.
export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const auth = await authorize(params.assignmentId)
    if (auth.error) return auth.error
    return NextResponse.json(await getConstructWorkspace(params.assignmentId, auth.payload.sub))
  } catch (err) {
    if (err instanceof Error && err.message === 'Construct search not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    logError('api/assignments/[id]/construct-search GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST { findings, notes, submit } — save a draft, or hand the find-list in.
export async function POST(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const auth = await authorize(params.assignmentId)
    if (auth.error) return auth.error
    if (auth.payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Previewing an assignment cannot save work.' }, { status: 403 })
    }

    const b = await req.json()
    const saved = await saveConstructSubmission(params.assignmentId, auth.payload.sub, {
      findings: b.findings,
      notes: b.notes,
      submit: b.submit === true,
    })
    return NextResponse.json({ submission: saved })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Construct search not found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (err.message === 'CLOSED') return NextResponse.json({ error: 'This assignment is closed — submissions are no longer accepted.' }, { status: 403 })
      if (err.message === 'ALREADY_SUBMITTED') return NextResponse.json({ error: 'You have already submitted. Ask your instructor to reopen it if you need to make changes.' }, { status: 409 })
    }
    logError('api/assignments/[id]/construct-search POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
