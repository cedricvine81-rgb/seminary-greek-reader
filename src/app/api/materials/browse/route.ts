import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { getStudentFolder } from '@/lib/materials'

// Student-facing browser: one level of the shared library the user can access
// (scoped to folders/files shared with their enrolled courses).
export async function GET(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const folderId = req.nextUrl.searchParams.get('folderId')
    const data = await getStudentFolder(payload.sub, folderId || null)
    return NextResponse.json(data)
  } catch (err) {
    logError('api/materials/browse', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
