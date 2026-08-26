import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { getActivityLogGrading, gradeActivityLog, applyAutoGrades } from '@/lib/activity-log-submissions'

const NOT_FOUND = 'Activity log assignment not found'

// Instructor grading view for an ACTIVITY_LOG assignment: every enrolled student's weekly
// reports, how many they have made, and the Pass/Fail this earns them.
export async function GET(_req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(await getActivityLogGrading(params.assignmentId))
  } catch (err) {
    if (err instanceof Error && err.message === NOT_FOUND) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    logError('api/assignments/[id]/activity-log/grade GET', err)
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

// POST { userId, grade?, gradeNote? } — save one student's Pass/Fail override (grade is
// 100, 0, or null to fall back to the computed result).
// POST { applyAuto: true } — accept the computed Pass/Fail for everyone not already graded.
export async function POST(req: NextRequest, { params }: { params: { assignmentId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const b = await req.json()

    if (b.applyAuto === true) {
      const count = await applyAutoGrades(params.assignmentId)
      await bustGradebook(params.assignmentId)
      return NextResponse.json({ ok: true, count })
    }

    const userId = String(b.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const grade = b.grade == null || b.grade === '' ? null : Math.max(0, Math.min(100, Math.round(Number(b.grade))))
    const gradeNote = typeof b.gradeNote === 'string' ? b.gradeNote : null
    const saved = await gradeActivityLog(params.assignmentId, userId, { grade, gradeNote })
    await bustGradebook(params.assignmentId)
    return NextResponse.json({ grade: saved.grade, gradeNote: saved.gradeNote })
  } catch (err) {
    logError('api/assignments/[id]/activity-log/grade POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
