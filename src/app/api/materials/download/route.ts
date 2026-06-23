import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { canAccessFile, getFileStoragePath } from '@/lib/materials'
import { getDownloadUrl } from '@/lib/storage'

// Resolve a file to a short-lived signed download URL — only after confirming the
// requester (instructor owner, or a student in a course it's shared with) may see it.
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (!(await canAccessFile(payload.sub, payload.role, id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const file = await getFileStoragePath(id)
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Uploaded file → signed storage URL; link-only material → its external URL.
    const url = file.storagePath ? await getDownloadUrl(file.storagePath) : file.fileUrl
    if (!url) return NextResponse.json({ error: 'No file' }, { status: 404 })
    return NextResponse.json({ url })
  } catch (err) {
    logError('api/materials/download', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
