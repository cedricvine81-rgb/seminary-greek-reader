import { getSupabaseAdmin } from './supabase'

// Private bucket holding all uploaded course materials. Access is gated entirely
// by our own permission checks (signed URLs are minted only after a check), so the
// bucket itself is never public.
export const MATERIALS_BUCKET = 'materials'

// Per-file ceiling. Kept modest so the library stays well within the Supabase
// storage quota — documents/handouts, not large video. Enforced both here (bucket
// fileSizeLimit) and before minting an upload URL.
export const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

let bucketReady: Promise<void> | null = null

/** Idempotently create the private materials bucket. Cached for the process. */
export function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const admin = getSupabaseAdmin()
      const { data } = await admin.storage.getBucket(MATERIALS_BUCKET)
      if (!data) {
        const { error } = await admin.storage.createBucket(MATERIALS_BUCKET, {
          public: false,
          fileSizeLimit: MAX_FILE_BYTES,
        })
        // Ignore "already exists" races; surface anything else.
        if (error && !/already exists/i.test(error.message)) throw error
      }
    })().catch(err => { bucketReady = null; throw err })
  }
  return bucketReady
}

/** Slugify a filename so storage keys stay safe while keeping the extension. */
function safeName(name: string): string {
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, '') : ''
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 80) || 'file'
  return base + ext
}

/** Deterministic-ish storage key: <instructorId>/<random>/<safe-name>. */
export function buildStoragePath(instructorId: string, fileName: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${instructorId}/${rand}/${safeName(fileName)}`
}

/** Mint a one-time signed URL the browser uses to PUT bytes straight to Supabase. */
export async function createSignedUpload(path: string) {
  await ensureBucket()
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.storage.from(MATERIALS_BUCKET).createSignedUploadUrl(path)
  if (error || !data) throw error ?? new Error('Could not create upload URL')
  return data // { signedUrl, token, path }
}

/** Short-lived signed download URL (minted only after a permission check). */
export async function getDownloadUrl(path: string, expiresIn = 120): Promise<string> {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.storage.from(MATERIALS_BUCKET).createSignedUrl(path, expiresIn)
  if (error || !data) throw error ?? new Error('Could not create download URL')
  return data.signedUrl
}

/** Best-effort removal of objects from storage (DB rows are removed separately). */
export async function deleteObjects(paths: string[]): Promise<void> {
  const clean = paths.filter(Boolean)
  if (clean.length === 0) return
  const admin = getSupabaseAdmin()
  await admin.storage.from(MATERIALS_BUCKET).remove(clean)
}
