import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment } from '@/lib/course-auth'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

// GET /api/exegesis/[id] — load a session
// Students load their own; instructors can load any session linked to their assignment
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const session = await prisma.exegesisSession.findUnique({ where: { id: params.id } })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (payload.role === 'INSTRUCTOR') {
      // Instructor may only view sessions linked to assignments they own
      if (!session.assignmentId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!await isAuthorizedForAssignment(session.assignmentId, payload.sub)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    } else {
      // Students can only see their own sessions
      if (session.userId !== payload.sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/exegesis/[id] — update annotations (student) or grade (instructor)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const existing = await prisma.exegesisSession.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (payload.role === 'INSTRUCTOR') {
      // Instructor can only save grade/gradeNote for sessions on their assignments
      if (!existing.assignmentId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (!await isAuthorizedForAssignment(existing.assignmentId, payload.sub)) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      const { grade, gradeNote } = body
      const updated = await prisma.exegesisSession.update({
        where: { id: params.id },
        data: {
          ...(grade !== undefined && { grade: grade === null ? null : Number(grade) }),
          ...(gradeNote !== undefined && { gradeNote }),
        },
      })
      return NextResponse.json({ session: updated })
    }

    // Student — can only patch their own session
    if (existing.userId !== payload.sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { annotations, title, startedAt, corrections } = body
    const updated = await prisma.exegesisSession.update({
      where: { id: params.id },
      data: {
        ...(annotations !== undefined && { annotations }),
        ...(corrections !== undefined && { corrections }),
        ...(title && { title }),
        // Only set startedAt once (never overwrite)
        ...(startedAt && !existing.startedAt && { startedAt: new Date(startedAt) }),
      },
    })
    return NextResponse.json({ session: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/exegesis/[id] — delete a session (student only, their own)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.exegesisSession.findFirst({
      where: { id: params.id, userId: payload.sub },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.exegesisSession.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
