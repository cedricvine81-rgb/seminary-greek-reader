import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'

export const metadata: Metadata = { title: 'Create Account' }

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-brand-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-parchment-100 font-serif text-2xl font-bold">Σ</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
            <p className="text-sm text-gray-500 mt-1">Join Seminary Greek</p>
          </div>
          <SignUpForm />
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
