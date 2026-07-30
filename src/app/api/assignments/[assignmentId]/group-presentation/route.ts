import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { getGroupPresentationGrading, gradeGroupPresentation, gradeGroupMember, setGroupLateApproval, reopenGroupSubmission } from '@/lib/group-presentations'

// GET — instructor grading view for a GROUP_PRESENTATION: every group, each member's
// contribution + attestation, submission status, and the group grade.
export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(await getGroupPresentationGrading(params.assignmentId))
  } catch (err) {
    if (err instanceof Error && err.message === 'Assignment not found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    logError('api/assignments/[id]/group-presentation GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}


// The gradebook lives on the cached course page; without busting it a saved grade sits in
// the database while the page keeps serving the old numbers (same fix as course-notes).
async function bustGradebook(assignmentId: string) {
  const a = await prisma.assignment.findUnique({ where: { id: assignmentId }, select: { courseId: true } })
  if (a) revalidatePath(`/instructor/courses/${a.courseId}`)
  revalidatePath('/student')
}

// POST { groupId, grade?, gradeNote?, lateApproved? } — grade a group, or approve/revoke
// a post-deadline submission. Presence of `lateApproved` routes to late approval;
// otherwise it's a grade save.
export async function POST(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const b = await req.json()
    const groupId = String(b.groupId ?? '')
    if (!groupId) return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })

    if (b.reopen === true) {
      await reopenGroupSubmission(params.assignmentId, groupId)
      return NextResponse.json({ ok: true })
    }

    if (typeof b.lateApproved === 'boolean') {
      await setGroupLateApproval(params.assignmentId, groupId, b.lateApproved)
      return NextResponse.json({ lateApproved: b.lateApproved })
    }

    const grade = b.grade == null || b.grade === '' ? null : Math.max(0, Math.min(100, Math.round(Number(b.grade))))
    const gradeNote = typeof b.gradeNote === 'string' ? b.gradeNote : null

    // A memberUserId routes to a per-member grade override; otherwise it's the group grade.
    if (b.memberUserId) {
      const saved = await gradeGroupMember(params.assignmentId, groupId, String(b.memberUserId), { grade, gradeNote })
      await bustGradebook(params.assignmentId)
      return NextResponse.json({ grade: saved.grade, gradeNote: saved.gradeNote })
    }

    const saved = await gradeGroupPresentation(params.assignmentId, groupId, { grade, gradeNote })
    await bustGradebook(params.assignmentId)
    return NextResponse.json({ grade: saved.grade, gradeNote: saved.gradeNote })
  } catch (err) {
    if (err instanceof Error && (err.message === 'Group not found' || err.message === 'Group member not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    logError('api/assignments/[id]/group-presentation POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
