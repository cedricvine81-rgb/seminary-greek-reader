import { cookies } from 'next/headers'
import Link from 'next/link'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { EyeOff } from 'lucide-react'

export function PreviewBanner() {
  const previewCookie = cookies().get('instructor_preview')
  if (!previewCookie) return null

  // Double-check: only show banner if the actual user is an instructor
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') return null

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4 z-50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <EyeOff size={16} className="shrink-0" />
        <span>Instructor Preview — you are viewing the student experience</span>
      </div>
      <Link
        href="/api/preview?mode=exit"
        className="shrink-0 text-sm font-semibold bg-white text-amber-700 hover:bg-amber-50 px-3 py-1 rounded-lg transition-colors"
      >
        ← Return to Dashboard
      </Link>
    </div>
  )
}
