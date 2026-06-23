import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { createFolder, renameFolder, deleteFolder } from '@/lib/materials'

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, parentId } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Folder name required' }, { status: 400 })
    const folder = await createFolder(payload.sub, name, parentId ?? null)
    return NextResponse.json({ folder }, { status: 201 })
  } catch (err) {
    logError('api/materials/folders POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    const { name } = await req.json()
    if (!id || !name?.trim()) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 })
    const folder = await renameFolder(payload.sub, id, name)
    return NextResponse.json({ folder })
  } catch (err) {
    logError('api/materials/folders PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteFolder(payload.sub, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/materials/folders DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
