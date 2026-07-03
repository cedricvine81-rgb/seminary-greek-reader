import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/auth/sign-up" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back to sign up</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
          <p>We collect the information you provide when creating an account: your name, institutional email address, institution, and account role (student or instructor). Students also provide a personal (non-institutional) email address, collected solely so we can stay in contact after graduation once the institutional address is deactivated — it is never used to sign in. We also collect usage data such as quiz responses and flashcard progress to power the learning features.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
          <p>Your information is used solely to operate Seminary Greek: to authenticate you, to save your progress, to enable instructor–student interactions, to process your subscription, and to improve the platform. We do not sell your data to third parties.</p>
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
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Messaging &amp; Email Visibility</h2>
          <p>Students may opt in to letting coursemates see their email address when messaging them; this setting defaults to off and can be changed at any time. Whether or not you opt in, administrators can view all messages sent through the platform for moderation, safety, and support purposes. See our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link> for details.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Payment Data</h2>
          <p>Student subscription payments are processed by Paddle, our third-party payment provider. We never receive or store your card number or other payment credentials — Paddle handles checkout and billing directly, and notifies us only of subscription status (active, past due, cancelled) so we can grant or restrict access accordingly. See our <Link href="/refunds" className="text-brand-600 hover:underline">Refund Policy</Link> for details on subscription payments.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">7. Data Retention</h2>
          <p>Your account data is retained while your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">8. Security</h2>
          <p>Data is stored on Supabase (PostgreSQL) with encryption at rest. All connections use TLS. We follow security best practices but cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">9. Contact</h2>
          <p>For privacy questions or data deletion requests, please contact the site administrator.</p>
        </section>
      </div>
    </main>
  )
}
