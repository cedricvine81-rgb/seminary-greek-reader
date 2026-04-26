import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'

export const metadata: Metadata = { title: 'Sign In' }

export default function SignInPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-brand-800 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-parchment-100 font-serif text-2xl font-bold">Σ</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sign In</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back to Seminary Greek</p>
          </div>
          <SignInForm />
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="text-brand-600 hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
