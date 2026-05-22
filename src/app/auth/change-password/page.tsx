import type { Metadata } from 'next'
import Link from 'next/link'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'

export const metadata: Metadata = { title: 'Change Password' }

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 bg-parchment-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-parchment-200 p-8">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 bg-brand-800 hover:bg-brand-700 rounded-xl mx-auto mb-3 transition-colors">
              <span className="text-parchment-100 font-greek text-2xl font-bold">Σ</span>
            </Link>
            <h1 className="text-xl font-bold text-ink-900">Change Password</h1>
            <p className="text-sm text-gray-500 mt-1">Set a new password for your account</p>
          </div>
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  )
}
