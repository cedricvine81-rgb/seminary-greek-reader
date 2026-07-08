import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isInstructorOfCourse } from '@/lib/course-auth'
import { logError } from '@/lib/logger'

async function authorize(courseId: string, groupId: string, userId: string) {
  if (!await isInstructorOfCourse(courseId, userId)) return false
  const group = await prisma.courseGroup.findFirst({ where: { id: groupId, courseId }, select: { id: true } })
  return !!group
}

// PATCH /api/courses/[courseId]/groups/[groupId] — rename and/or set the membership.
// Body: { name?: string, memberIds?: string[] }. Instructor only. A student can belong to
// at most one group per course, so adding a student here removes them from other groups.
export async function PATCH(req: NextRequest, { params }: { params: { courseId: string; groupId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { courseId, groupId } = params
    if (!await authorize(courseId, groupId, payload.sub)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { name, memberIds, assignmentId } = await req.json()
    const ops = []

    if (typeof name === 'string') {
      const trimmed = name.trim()
      if (!trimmed) return NextResponse.json({ error: 'A group name is required.' }, { status: 400 })
      if (trimmed.length > 100) return NextResponse.json({ error: 'Group name must be 100 characters or fewer.' }, { status: 400 })
      ops.push(prisma.courseGroup.update({ where: { id: groupId }, data: { name: trimmed } }))
    }

    // Link this group to a Group Presentation (assignmentId), or unlink it (null). The
    // assignment must be a GROUP_PRESENTATION belonging to this course.
    if (assignmentId !== undefined) {
      let next: string | null = null
      if (assignmentId !== null) {
        const a = await prisma.assignment.findFirst({
          where: { id: String(assignmentId), courseId, type: 'GROUP_PRESENTATION' }, select: { id: true },
        })
        if (!a) return NextResponse.json({ error: 'That presentation was not found for this course.' }, { status: 400 })
        next = a.id
      }
      // Only touch anything when the link actually changes. On a change, discard the
      // group's contributions + submission so work from the previous presentation can't
      // resurface under the new one.
      const current = await prisma.courseGroup.findUnique({ where: { id: groupId }, select: { assignmentId: true } })
      if ((current?.assignmentId ?? null) !== next) {
        ops.push(
          prisma.groupContribution.deleteMany({ where: { groupId } }),
          prisma.groupSubmission.deleteMany({ where: { groupId } }),
          prisma.courseGroup.update({ where: { id: groupId }, data: { assignmentId: next } }),
        )
      }
    }

    if (Array.isArray(memberIds)) {
      // Only approved students enrolled in this course may be added.
      const valid = await prisma.enrollment.findMany({
        where: { courseId, status: 'APPROVED', userId: { in: memberIds }, user: { deletedAt: null } },
        select: { userId: true },
      })
      const validIds = valid.map(v => v.userId)
      ops.push(
        // Each chosen student can be in only one group per course.
        prisma.courseGroupMember.deleteMany({ where: { userId: { in: validIds }, groupId: { not: groupId }, group: { courseId } } }),
        prisma.courseGroupMember.deleteMany({ where: { groupId } }),
        prisma.courseGroupMember.createMany({ data: validIds.map(userId => ({ groupId, userId })) }),
      )
    }

    if (ops.length) await prisma.$transaction(ops)
    revalidatePath(`/instructor/courses/${courseId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/courses/groups PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// DELETE /api/courses/[courseId]/groups/[groupId] — remove a group (and its memberships).
export async function DELETE(req: NextRequest, { params }: { params: { courseId: string; groupId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { courseId, groupId } = params
    if (!await authorize(courseId, groupId, payload.sub)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.courseGroup.delete({ where: { id: groupId } })
    revalidatePath(`/instructor/courses/${courseId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/courses/groups DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
