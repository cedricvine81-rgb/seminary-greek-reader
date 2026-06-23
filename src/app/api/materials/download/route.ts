import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { canAccessFile, getFileStoragePath } from '@/lib/materials'
import { getDownloadUrl } from '@/lib/storage'

// Resolve a file to its download URL and 302-redirect to it — only after confirming
// the requester (instructor owner, or a student in a course it's shared with) may
// see it. Returning a redirect (rather than JSON) lets the client use a plain
// <a href target="_blank"> link, which browsers never block the way they block a
// window.open() fired after an async fetch.
export async function GET(req: NextRequest) {
  const text = (msg: string, status: number) => new NextResponse(msg, { status, headers: { 'content-type': 'text/plain' } })
  try {
    const payload = getPayload()
    if (!payload) return text('Please sign in.', 401)
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return text('Missing file id.', 400)

    if (!(await canAccessFile(payload.sub, payload.role, id))) return text('File not found.', 404)
    const file = await getFileStoragePath(id)
    if (!file) return text('File not found.', 404)

    // Uploaded file → signed storage URL; link-only material → its external URL.
    const url = file.storagePath ? await getDownloadUrl(file.storagePath) : file.fileUrl
    if (!url) return text('This material has no file attached.', 404)
    return NextResponse.redirect(url, 302)
  } catch (err) {
    logError('api/materials/download', err)
    return text('Server error.', 500)
  }
}
