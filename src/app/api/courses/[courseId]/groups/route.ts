import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import { isInstructorOfCourse } from '@/lib/course-auth'
import { logError } from '@/lib/logger'

function memberName(u: { firstName: string | null; surname: string | null }) {
  return [u.firstName, u.surname].filter(Boolean).join(' ') || 'Student'
}

async function groupsWithMembers(courseId: string, onlyUserId?: string) {
  const groups = await prisma.courseGroup.findMany({
    where: {
      courseId,
      ...(onlyUserId ? { members: { some: { userId: onlyUserId } } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      members: {
        where: { user: { deletedAt: null } },
        include: { user: { select: { id: true, firstName: true, surname: true } } },
      },
    },
  })
  return groups.map(g => ({
    id: g.id,
    name: g.name,
    assignmentId: g.assignmentId,  // the Group Presentation this group is linked to, or null
    members: g.members.map(m => ({ id: m.user.id, name: memberName(m.user) })),
  }))
}

// GET /api/courses/[courseId]/groups
//   Instructor of the course → every group (with members).
//   Enrolled student → only the group they belong to (with members), so they can message it.
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { courseId } = params

    if (payload.role === 'INSTRUCTOR' && await isInstructorOfCourse(courseId, payload.sub)) {
      return NextResponse.json({ groups: await groupsWithMembers(courseId) })
    }

    const enrolled = await prisma.enrollment.findFirst({
      where: { courseId, userId: payload.sub, status: 'APPROVED' },
      select: { id: true },
    })
    if (!enrolled) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ groups: await groupsWithMembers(courseId, payload.sub) })
  } catch (err) {
    logError('api/courses/groups GET', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

// POST /api/courses/[courseId]/groups — create a new (empty) group. Instructor only.
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { courseId } = params
    if (!await isInstructorOfCourse(courseId, payload.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { name } = await req.json()
    const trimmed = (name ?? '').trim()
    if (!trimmed) return NextResponse.json({ error: 'A group name is required.' }, { status: 400 })
    if (trimmed.length > 100) return NextResponse.json({ error: 'Group name must be 100 characters or fewer.' }, { status: 400 })

    const group = await prisma.courseGroup.create({ data: { courseId, name: trimmed } })
    revalidatePath(`/instructor/courses/${courseId}`)
    return NextResponse.json({ group: { id: group.id, name: group.name, assignmentId: null, members: [] } }, { status: 201 })
  } catch (err) {
    logError('api/courses/groups POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
