import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { listFolder } from '@/lib/materials'

// Instructor file-manager: one level of the library under ?folderId (null = root).
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const folderId = req.nextUrl.searchParams.get('folderId')
    const data = await listFolder(payload.sub, folderId || null)
    return NextResponse.json(data)
  } catch (err) {
    logError('api/materials/list', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
