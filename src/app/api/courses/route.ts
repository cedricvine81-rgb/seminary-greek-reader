import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { CourseLevel } from '@/types/course'

function getPayload() {
  const token = getTokenFromCookies()
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
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
}

export async function POST(req: NextRequest) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, listing, level, startDate, endDate, institutionName } = body

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
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      instructorId: payload.sub,
      institutionId,
    },
  })
  return NextResponse.json({ course }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const course = await prisma.course.update({
    where: { id },
    data: {
      name: body.name,
      listing: body.listing || null,
      level: body.level as CourseLevel,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    },
  })
  return NextResponse.json({ course })
}
