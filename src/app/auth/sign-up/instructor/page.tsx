import type { Metadata } from 'next'
import { SignUpCard } from '@/components/auth/SignUpCard'

export const metadata: Metadata = { title: 'Create Instructor Account' }

export default function InstructorSignUpPage() {
  return (
    <SignUpCard
      heading="Create your instructor account"
      subheading="Instructor accounts are free · approved by an admin before first sign-in"
      lockedRole="INSTRUCTOR"
    />
  )
}
