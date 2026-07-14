import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import type { Role } from '@/types/auth'

// Shared sign-up card. Used by the generic /auth/sign-up (role picker shown) and the
// role-specific /auth/sign-up/student and /auth/sign-up/instructor pages (lockedRole set).
export function SignUpCard({ heading, subheading, lockedRole }: {
  heading: string
  subheading: string
  lockedRole?: Role
}) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-lg">
        <div className="bg-surface rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">{heading}</h1>
            <p className="text-sm text-gray-500 mt-1">{subheading}</p>
          </div>
          <SignUpForm lockedRole={lockedRole} />
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            <Link href="/" className="hover:text-brand-600 hover:underline transition-colors">
              ← Return to Seminary Greek
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
