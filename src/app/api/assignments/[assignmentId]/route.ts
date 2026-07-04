import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'
import { ensureCourseNotesFoldersForAssignment } from '@/lib/notes'
import { normalizeWeights } from '@/lib/exam-grading'
import { MIN_LOCKDOWN_AUTOSUBMIT } from '@/lib/constants'

// GET /api/assignments/[assignmentId] — fetch a single assignment (students can read published ones)
export async function GET(
  _req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.assignmentId },
      select: {
        id: true, title: true, type: true, weekNumber: true,
        dueDate: true, reference: true, instructions: true,
        isPublished: true, courseId: true, timePerQuestion: true, reviewTimeSeconds: true,
        opensAt: true, submissionDeadline: true, round1Deadline: true, round2Deadline: true,
        allowReaderInRound2: true, maxAppeals: true, glossFrequency: true, gradeWeights: true,
        lockdown: true, lockdownMaxViolations: true,
      },
    })
    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Students can only see published assignments they are enrolled in
    if (payload.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: payload.sub, courseId: assignment.courseId, status: 'APPROVED' },
      })
      if (!enrollment && !assignment.isPublished) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ assignment })
  } catch (err) {
    logError('api/assignments/[assignmentId]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


export async function PATCH(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const {
    isPublished,
    title, weekNumber, dueDate, instructions, reference,
    timePerQuestion, reviewTimeSeconds, provideDefinition, maxRetakes,
    allowLate, lateDaysLimit, opensAt, submissionDeadline, round1Deadline, round2Deadline,
    allowReaderInRound2, maxAppeals, glossFrequency, gradeWeights, lockdown, lockdownMaxViolations,
    notesFolderName,
  } = body

  const data: Record<string, unknown> = {}

  if (isPublished !== undefined) {
    data.isPublished = Boolean(isPublished)
  } else {
    if (title !== undefined)        data.title = title
    if (notesFolderName !== undefined) data.notesFolderName = String(notesFolderName).trim() || null
    if (weekNumber !== undefined)   data.weekNumber = Number(weekNumber)
    if (dueDate !== undefined)      data.dueDate = new Date(dueDate)
    if (instructions !== undefined) data.instructions = instructions || null
    // Passage reference (translation exercises). Reject clearing it to empty.
    if (reference !== undefined) {
      if (typeof reference === 'string' && reference.trim()) data.reference = reference.trim()
      else if (reference === null || reference === '') {
        return NextResponse.json({ error: 'A passage reference is required.' }, { status: 400 })
      }
    }
    if (timePerQuestion !== undefined)
      data.timePerQuestion = Number(timePerQuestion) > 0 ? Number(timePerQuestion) : null
    if (reviewTimeSeconds !== undefined)
      data.reviewTimeSeconds = Number(reviewTimeSeconds) > 0 ? Number(reviewTimeSeconds) : null
    if (provideDefinition !== undefined) data.provideDefinition = Boolean(provideDefinition)
    if (allowReaderInRound2 !== undefined) data.allowReaderInRound2 = Boolean(allowReaderInRound2)
    if ('glossFrequency' in body) data.glossFrequency = glossFrequency != null && Number(glossFrequency) > 0 ? Number(glossFrequency) : null
    if ('gradeWeights' in body) data.gradeWeights = normalizeWeights(gradeWeights)
    if ('lockdown' in body) data.lockdown = Boolean(lockdown)
    if ('lockdownMaxViolations' in body)
      // Clamp any positive value up to the floor so one stray violation can't end an exam.
      data.lockdownMaxViolations = lockdownMaxViolations != null && Number(lockdownMaxViolations) > 0
        ? Math.max(Number(lockdownMaxViolations), MIN_LOCKDOWN_AUTOSUBMIT) : null
    if (maxAppeals !== undefined) data.maxAppeals = maxAppeals != null && Number(maxAppeals) > 0 ? Number(maxAppeals) : null
    if ('maxRetakes' in body)
      data.maxRetakes = maxRetakes != null ? Number(maxRetakes) : null
    if (allowLate !== undefined) {
      data.allowLate = Boolean(allowLate)
      data.lateDaysLimit = allowLate && lateDaysLimit != null ? Number(lateDaysLimit) : null
    }
    if ('opensAt' in body)
      data.opensAt = opensAt ? new Date(opensAt) : null
    if ('submissionDeadline' in body)
      data.submissionDeadline = submissionDeadline ? new Date(submissionDeadline) : null
    if ('round1Deadline' in body)
      data.round1Deadline = round1Deadline ? new Date(round1Deadline) : null
    if ('round2Deadline' in body)
      data.round2Deadline = round2Deadline ? new Date(round2Deadline) : null
    // Reject a Round 2 deadline that is not strictly after Round 1
    if (round1Deadline && round2Deadline && new Date(round2Deadline) <= new Date(round1Deadline)) {
      return NextResponse.json({ error: 'Round 2 deadline must be after the Round 1 deadline.' }, { status: 400 })
    }
  }

  const updated = await prisma.assignment.update({
    where: { id: params.assignmentId },
    data,
  })

  // Course Notes: (re)provision student folders once it's published or its name changes.
  if (updated.type === 'COURSE_NOTES' && updated.isPublished) {
    await ensureCourseNotesFoldersForAssignment(updated.id)
  }

  return NextResponse.json({ assignment: updated })

  } catch (err) {
    logError('api/assignments/[assignmentId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Capture the course before deleting so we can bust its cached pages
  const existing = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    select: { courseId: true },
  })

  await prisma.assignment.delete({ where: { id: params.assignmentId } })

  // Bust the Router Cache so the deleted assignment doesn't linger on
  // the course page / assignment lists after redirect.
  if (existing?.courseId) {
    revalidatePath(`/instructor/courses/${existing.courseId}`)
  }
  revalidatePath('/instructor/assignments')
  revalidatePath('/instructor')
  revalidatePath('/student/assignments')

  return NextResponse.json({ ok: true })

  } catch (err) {
    logError('api/assignments/[assignmentId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
