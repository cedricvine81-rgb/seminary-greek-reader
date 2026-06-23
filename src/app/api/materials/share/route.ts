import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { shareFile, unshareFile, shareFolder, unshareFolder } from '@/lib/materials'

// Add or remove a course share for a file or folder.
// Body: { type: 'file'|'folder', id, courseId, action: 'add'|'remove' }
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { type, id, courseId, action } = await req.json()
    if (!id || !courseId || !['file', 'folder'].includes(type) || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (type === 'file') {
      action === 'add' ? await shareFile(payload.sub, id, courseId) : await unshareFile(payload.sub, id, courseId)
    } else {
      action === 'add' ? await shareFolder(payload.sub, id, courseId) : await unshareFolder(payload.sub, id, courseId)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/materials/share', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
