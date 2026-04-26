import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getCourseReport, exportCourseResultsCSV } from '@/lib/reports'

export async function GET(req: NextRequest) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('courseId')
  const format = req.nextUrl.searchParams.get('format')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })

  if (format === 'csv') {
    const csv = await exportCourseResultsCSV(courseId)
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="results.csv"' },
    })
  }

  const report = await getCourseReport(courseId)
  if (!report) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  return NextResponse.json(report)
}
