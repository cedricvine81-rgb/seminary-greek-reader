import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

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
    console.error(err)
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
    title, weekNumber, dueDate, instructions,
    timePerQuestion, reviewTimeSeconds, provideDefinition, maxRetakes,
    allowLate, lateDaysLimit,
  } = body

  const data: Record<string, unknown> = {}

  if (isPublished !== undefined) {
    data.isPublished = Boolean(isPublished)
  } else {
    if (title !== undefined)        data.title = title
    if (weekNumber !== undefined)   data.weekNumber = Number(weekNumber)
    if (dueDate !== undefined)      data.dueDate = new Date(dueDate)
    if (instructions !== undefined) data.instructions = instructions || null
    if (timePerQuestion !== undefined)
      data.timePerQuestion = Number(timePerQuestion) > 0 ? Number(timePerQuestion) : null
    if (reviewTimeSeconds !== undefined)
      data.reviewTimeSeconds = Number(reviewTimeSeconds) > 0 ? Number(reviewTimeSeconds) : null
    if (provideDefinition !== undefined) data.provideDefinition = Boolean(provideDefinition)
    if ('maxRetakes' in body)
      data.maxRetakes = maxRetakes != null ? Number(maxRetakes) : null
    if (allowLate !== undefined) {
      data.allowLate = Boolean(allowLate)
      data.lateDaysLimit = allowLate && lateDaysLimit != null ? Number(lateDaysLimit) : null
    }
  }

  const updated = await prisma.assignment.update({
    where: { id: params.assignmentId },
    data,
  })

  return NextResponse.json({ assignment: updated })

  } catch (err) {
    console.error(err)
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

  await prisma.assignment.delete({ where: { id: params.assignmentId } })
  return NextResponse.json({ ok: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
