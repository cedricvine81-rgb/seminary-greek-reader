import type { Metadata } from 'next'
import { SignUpCard } from '@/components/auth/SignUpCard'

export const metadata: Metadata = { title: 'Create Student Account' }

export default function StudentSignUpPage() {
  return (
    <SignUpCard
      headingKey="auth.createStudentAccount"
      subheadingKey="auth.joinAsStudent"
      lockedRole="STUDENT"
    />
  )
}
