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
  const { allowLate, lateDaysLimit } = body

  const updated = await prisma.assignment.update({
    where: { id: params.assignmentId },
    data: {
      allowLate: Boolean(allowLate),
      lateDaysLimit: allowLate && lateDaysLimit != null ? Number(lateDaysLimit) : null,
    },
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
