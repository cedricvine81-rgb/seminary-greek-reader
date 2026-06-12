import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { getMaterialsByCourse, createMaterial, updateMaterial, deleteMaterial } from '@/lib/materials'

export async function GET(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })

  const materials = await getMaterialsByCourse(courseId)
  return NextResponse.json({ materials })

  } catch (err) {
    logError('api/materials', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const material = await createMaterial(body)
  return NextResponse.json({ material }, { status: 201 })

  } catch (err) {
    logError('api/materials', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const material = await updateMaterial(id, body)
  return NextResponse.json({ material })

  } catch (err) {
    logError('api/materials', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
  const payload = getPayload()
  if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await deleteMaterial(id)
  return NextResponse.json({ ok: true })

  } catch (err) {
    logError('api/materials', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
