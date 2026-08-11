import type { Metadata } from 'next'
import { SignUpCard } from '@/components/auth/SignUpCard'

export const metadata: Metadata = { title: 'Create Account' }

export default function SignUpPage() {
  return <SignUpCard headingKey="auth.createAccount" subheadingKey="auth.joinSeminaryGreek" />
}
