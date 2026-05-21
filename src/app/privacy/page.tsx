import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/auth/sign-up" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back to sign up</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2025</p>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
          <p>We collect the information you provide when creating an account: your name, email address, institution, and account role (student or instructor). We also collect usage data such as quiz responses and flashcard progress to power the learning features.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p>Your information is used solely to operate Seminary Greek: to authenticate you, to save your progress, to enable instructor–student interactions, and to improve the platform. We do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">3. Passwords</h2>
          <p>Passwords are hashed using bcrypt before storage. We never store or transmit plain-text passwords.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">4. Cookies</h2>
          <p>We use a single secure, HttpOnly cookie to maintain your session. This cookie contains a signed JWT token and is not used for advertising or tracking.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Data Retention</h2>
          <p>Your account data is retained while your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Security</h2>
          <p>Data is stored on Supabase (PostgreSQL) with encryption at rest. All connections use TLS. We follow security best practices but cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">7. Contact</h2>
          <p>For privacy questions or data deletion requests, please contact the site administrator.</p>
        </section>
      </div>
    </main>
  )
}
