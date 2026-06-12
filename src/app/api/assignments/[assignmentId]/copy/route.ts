import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { isAuthorizedForAssignment, isInstructorOfCourse } from '@/lib/course-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!await isAuthorizedForAssignment(params.assignmentId, payload.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const source = await prisma.assignment.findUnique({
    where: { id: params.assignmentId },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { targetCourseId, weekNumber, dueDate } = body

  if (!await isInstructorOfCourse(targetCourseId, payload.sub)) {
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
      reviewTimeSeconds: source.reviewTimeSeconds,
      allowLate:      source.allowLate,
      lateDaysLimit:  source.lateDaysLimit,
      // Carry quiz config so the copy behaves and edits like the original:
      provideDefinition: source.provideDefinition,   // grading mode for typed answers
      maxRetakes:     source.maxRetakes,
      maxAppeals:     source.maxAppeals,
      morphSubtype:   source.morphSubtype,           // morphology regenerate
      vocabSelection: source.vocabSelection ?? undefined,  // vocab frequency-section choice
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

  } catch (err) {
    logError('api/assignments/[assignmentId]/copy', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
