import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { createFileRecord, deleteFile } from '@/lib/materials'

// Record a file after the browser has uploaded its bytes directly to storage.
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    if (!body.storagePath || !body.title) return NextResponse.json({ error: 'Missing file info' }, { status: 400 })
    const file = await createFileRecord(payload.sub, {
      folderId: body.folderId ?? null,
      title: body.title,
      description: body.description,
      storagePath: body.storagePath,
      mimeType: body.mimeType,
      sizeBytes: typeof body.sizeBytes === 'number' ? body.sizeBytes : undefined,
      originalName: body.originalName,
    })
    return NextResponse.json({ file }, { status: 201 })
  } catch (err) {
    logError('api/materials/files POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteFile(payload.sub, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/materials/files DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
