import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const source = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!source || source.createdById !== payload.sub) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const { targetCourseId, weekNumber, dueDate } = body

  const targetCourse = await prisma.course.findUnique({
    where: { id: targetCourseId },
    select: { id: true, instructorId: true },
  })
  if (!targetCourse || targetCourse.instructorId !== payload.sub) {
    return NextResponse.json({ error: 'Target course not found' }, { status: 404 })
  }

  const copy = await prisma.assignment.create({
    data: {
      courseId:       targetCourseId,
      createdById:    payload.sub,
      title:          source.title,
      type:           source.type,
      weekNumber:     weekNumber ?? source.weekNumber,
      dueDate:        dueDate ? new Date(dueDate) : source.dueDate,
      level:          source.level,
      reference:      source.reference,
      instructions:   source.instructions,
      timePerQuestion: source.timePerQuestion,
      allowLate:      source.allowLate,
      lateDaysLimit:  source.lateDaysLimit,
      isPublished:    false,
      questions: {
        create: source.questions.map(q => ({
          position:     q.position,
          type:         q.type,
          prompt:       q.prompt,
          correctAnswer: q.correctAnswer,
          options:      q.options,
          points:       q.points,
          reference:    q.reference,
        })),
      },
    },
  })

  return NextResponse.json({ assignment: copy })
}
