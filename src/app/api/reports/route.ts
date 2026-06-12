import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getCourseReport, exportCourseResultsCSV } from '@/lib/reports'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })

  // Verify the requesting instructor owns or co-teaches this course
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      OR: [
        { instructorId: payload.sub },
        { coInstructors: { some: { userId: payload.sub } } },
      ],
    },
    select: { id: true },
  })
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const format = req.nextUrl.searchParams.get('format')

  if (format === 'csv') {
    const csv = await exportCourseResultsCSV(courseId)
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="results.csv"' },
    })
  }

  const report = await getCourseReport(courseId)
  if (!report) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  return NextResponse.json(report)

  } catch (err) {
    logError('api/reports', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
