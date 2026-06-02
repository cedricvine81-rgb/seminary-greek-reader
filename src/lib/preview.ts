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
