import { cookies } from 'next/headers'

export function isPreviewMode(): boolean {
  try {
    return cookies().get('instructor_preview')?.value === '1'
  } catch {
    return false
  }
}

/** Returns true if the user is a student, OR an instructor viewing in preview mode. */
export function canViewStudentPages(payload: { role: string } | null): boolean {
  if (!payload) return false
  if (payload.role === 'STUDENT') return true
  if (payload.role === 'INSTRUCTOR' && isPreviewMode()) return true
  return false
}

/**
 * Where to send someone a student page has just turned away.
 *
 * An instructor is not lost — they are signed in, they simply have not entered preview mode,
 * so a sign-in screen is both wrong and alarming. Send them through the preview door and back
 * to the page they asked for. This matters most for pages reachable from the PUBLIC parts of
 * the app (the Grammar chapters' "Practise these forms", say), where an instructor can arrive
 * without ever passing through their own dashboard.
 */
export function studentPageEntry(payload: { role: string } | null, path: string): string {
  return payload?.role === 'INSTRUCTOR'
    ? `/api/preview?mode=enter&redirect=${encodeURIComponent(path)}`
    : '/auth/sign-in'
}
