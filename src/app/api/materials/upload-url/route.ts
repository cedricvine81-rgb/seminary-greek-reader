import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { getPayload } from '@/lib/auth'
import { buildStoragePath, createSignedUpload, MAX_FILE_BYTES } from '@/lib/storage'

// Mint a one-time signed URL so the browser can PUT bytes straight to Supabase
// Storage (bypassing the serverless request-body size limit).
export async function POST(req: NextRequest) {
  try {
    const payload = getPayload()
    if (!payload || payload.role !== 'INSTRUCTOR') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { fileName, size } = await req.json()
    if (!fileName) return NextResponse.json({ error: 'Missing fileName' }, { status: 400 })
    if (typeof size === 'number' && size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `File exceeds the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB limit.` }, { status: 413 })
    }
    const path = buildStoragePath(payload.sub, fileName)
    const signed = await createSignedUpload(path)
    return NextResponse.json({ path: signed.path, token: signed.token })
  } catch (err) {
    logError('api/materials/upload-url', err)
    return NextResponse.json({ error: 'Could not start upload.' }, { status: 500 })
  }
}
