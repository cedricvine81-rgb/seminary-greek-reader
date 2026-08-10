import { NextRequest, NextResponse } from 'next/server'
import { ASSESSMENT_LANGUAGES } from '@/lib/assessment-languages'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getPayload } from '@/lib/auth'
import type { CourseLevel } from '@/types/course'

export async function GET(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courses = await prisma.course.findMany({
    where: payload.role === 'INSTRUCTOR'
      ? { OR: [{ instructorId: payload.sub }, { coInstructors: { some: { userId: payload.sub } } }] }
      : { enrollments: { some: { userId: payload.sub } } },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ courses })

  } catch (err) {
    logError('api/courses', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, listing, level, startDate, endDate, institutionName, language } = body

  let institutionId: string | undefined
  if (institutionName) {
    const inst = await prisma.institution.upsert({
      where: { name: institutionName },
      update: {},
      create: { name: institutionName },
    })
    institutionId = inst.id
  }

  const course = await prisma.course.create({
    data: {
      name, listing: listing || null, level: level as CourseLevel,
      // The language ALL assessment in this course is set and marked in. Only the locales the
      // app actually ships are accepted; anything else falls back to English rather than
      // silently storing a value no catalogue exists for.
      language: ASSESSMENT_LANGUAGES.includes(language) ? language : 'en',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      instructorId: payload.sub,
      institutionId,
    },
  })
  return NextResponse.json({ course }, { status: 201 })

  } catch (err) {
    logError('api/courses', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()

  // Archive/unarchive shortcut — only requires instructorId ownership
  if ('isArchived' in body) {
    const existing = await prisma.course.findFirst({
      where: { id, instructorId: payload.sub },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const course = await prisma.course.update({
      where: { id },
      data: { isArchived: Boolean(body.isArchived) },
    })
    return NextResponse.json({ course })
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      name: body.name,
      listing: body.listing || null,
      level: body.level as CourseLevel,
      ...(ASSESSMENT_LANGUAGES.includes(body.language) ? { language: body.language } : {}),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    },
  })
  return NextResponse.json({ course })

  } catch (err) {
    logError('api/courses', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
