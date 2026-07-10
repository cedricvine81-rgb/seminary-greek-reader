import type { Metadata } from 'next'
import { SignUpCard } from '@/components/auth/SignUpCard'

export const metadata: Metadata = { title: 'Create Student Account' }

export default function StudentSignUpPage() {
  return (
    <SignUpCard
      heading="Create your student account"
      subheading="Join Seminary Greek as a student"
      lockedRole="STUDENT"
    />
  )
}
