import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CourseForm } from '@/components/instructor/CourseForm'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'New Course' }

export default function NewCoursePage() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'INSTRUCTOR') redirect('/auth/sign-in')

  return (
    <DashboardShell role="INSTRUCTOR" pageTitle="Create Course">
      <CourseForm />
    </DashboardShell>
  )
}
