import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
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
    timePerQuestion, provideDefinition, maxRetakes,
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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.assignment.delete({ where: { id: params.assignmentId } })
  return NextResponse.json({ ok: true })
}
