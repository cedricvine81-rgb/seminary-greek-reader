import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { createNoteFolder, updateNoteFolder, deleteNoteFolder } from '@/lib/notes'

export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { name, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const folder = await createNoteFolder(payload.sub, name, color || 'blue')
    return NextResponse.json({ folder }, { status: 201 })
  } catch (err) {
    logError('api/notes/folders POST', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { name, color } = await req.json()
    const folder = await updateNoteFolder(payload.sub, id, { name, color })
    return NextResponse.json({ folder })
  } catch (err) {
    logError('api/notes/folders PATCH', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await deleteNoteFolder(payload.sub, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/notes/folders DELETE', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
