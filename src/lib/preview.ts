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
 * Self-study is the one student surface an instructor uses AS THEMSELVES, not as a preview
 * of someone else's. Instructors asked for this: they are learning the language too, and the
 * progress they record has always been real — MorphologyProgress keys on the signed-in user
 * id and /api/morphology/progress is gated on login alone, so an instructor working a track
 * was already saving to their own account. Only the door was wrong: it ran through preview
 * mode, which swapped their sidebar for the student one and captioned their own work "you are
 * viewing the student experience".
 *
 * So this gate admits an instructor with no preview cookie. Preview still works and still
 * looks like the student view — an instructor who wants to check what a student sees enters
 * it the same way as before.
 */
export function canUseSelfStudy(payload: { role: string } | null): boolean {
  if (!payload) return false
  return payload.role === 'STUDENT' || payload.role === 'INSTRUCTOR'
}

/**
 * Which sidebar to render on a self-study page. An instructor who came in through their own
 * nav keeps their own nav — being dropped into the student sidebar is what made this feel
 * like someone else's screen. In preview mode the student shell is the whole point, so it
 * stays.
 */
export function selfStudyShellRole(payload: { role: string } | null): 'INSTRUCTOR' | 'STUDENT' {
  return payload?.role === 'INSTRUCTOR' && !isPreviewMode() ? 'INSTRUCTOR' : 'STUDENT'
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
