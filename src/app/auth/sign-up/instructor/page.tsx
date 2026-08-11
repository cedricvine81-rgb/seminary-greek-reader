import type { Metadata } from 'next'
import { SignUpCard } from '@/components/auth/SignUpCard'

export const metadata: Metadata = { title: 'Create Instructor Account' }

export default function InstructorSignUpPage() {
  return (
    <SignUpCard
      headingKey="auth.createInstructorAccount"
      subheadingKey="auth.instructorSubheading"
      lockedRole="INSTRUCTOR"
    />
  )
}
