import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

// PATCH /api/admin/courses/[courseId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { name, description, isPublished } = body
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description || null
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished)

    const course = await prisma.course.update({ where: { id: params.courseId }, data })
    return NextResponse.json({ course })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2025') return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    logError('api/admin/courses/[courseId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/admin/courses/[courseId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const admin = getAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Snapshot for audit before destruction
    const existing = await prisma.course.findUnique({
      where: { id: params.courseId },
      select: { id: true, name: true, instructorId: true, _count: { select: { enrollments: true, assignments: true } } },
    })
    // Assignments, questions, attempts, responses, enrollments all have
    // onDelete: Cascade in the schema, so deleting the course removes them atomically.
    await prisma.course.delete({ where: { id: params.courseId } })
    if (existing) {
      await recordAudit({
        actorId: admin.sub, actorEmail: admin.email,
        action: 'course.delete', targetType: 'Course', targetId: params.courseId,
        before: existing, after: null,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === 'P2025') return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    logError('api/admin/courses/[courseId]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
