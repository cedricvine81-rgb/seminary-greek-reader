import type { Metadata } from 'next'
import { SignUpCard } from '@/components/auth/SignUpCard'

export const metadata: Metadata = { title: 'Create Account' }

export default function SignUpPage() {
  return <SignUpCard heading="Create Account" subheading="Join Seminary Greek" />
}
