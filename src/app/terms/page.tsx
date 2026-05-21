import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/auth/sign-up" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back to sign up</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2025</p>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>By creating an account on Seminary Greek, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. Use of the Service</h2>
          <p>Seminary Greek is an educational platform for studying biblical Greek. You agree to use it only for lawful, educational purposes and not to attempt to disrupt or misuse the service.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">3. Your Account</h2>
          <p>You are responsible for maintaining the confidentiality of your password and for all activity under your account. Notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">4. Content</h2>
          <p>Biblical texts are provided under their respective open licenses (SBLGNT, WEB, etc.). Course materials created by instructors remain their intellectual property.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Disclaimer</h2>
          <p>The service is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any loss or damage arising from your use of Seminary Greek.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
    </main>
  )
}
