import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/auth/sign-up" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back to sign up</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>Seminary Greek is operated by Cedric Vine, individually (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;the operator&rdquo;). By creating an account you agree to be bound by these Terms of Service and by our <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>. If you do not agree, do not create an account or use the service.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. Your Account</h2>
          <p>Accounts are personal to you and may not be shared, transferred, or used by anyone other than the person who registered them. You are responsible for maintaining the confidentiality of your password and for all activity under your account. Notify us immediately of any unauthorized use.</p>
          <p>Student accounts require both an institutional email address and a personal (non-institutional) email address. The personal address is collected solely so we can stay in contact with you — for example, about your account or continued access — after you graduate and your institutional address is deactivated. It is never used as a login credential.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">3. Subscription &amp; Payment</h2>
          <p>Student accounts created after the date of these Terms require a paid subscription of $10 per year to access the service. Subscriptions are billed and processed by our payment provider, Paddle, and renew automatically each year unless cancelled before the renewal date.</p>
          <p>All payments are <strong>non-refundable</strong>, including partial years and unused portions of a subscription term — see our <Link href="/refunds" className="text-brand-600 hover:underline">Refund Policy</Link> for details. If a renewal payment fails or a subscription is cancelled or lapses, access to the service is suspended until payment is brought current or a new subscription is purchased. We do not store your payment card details; they are handled entirely by Paddle.</p>
          <p>Students whose accounts were created before these Terms took effect are grandfathered and are not required to pay the subscription fee to retain existing access.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">4. No Duplication or Plagiarism of the App</h2>
          <p>By using Seminary Greek, you agree that you will not copy, reproduce, scrape, decompile, reverse-engineer, or otherwise duplicate the software, source code, database structure, user interface, course architecture, or compiled content of this app, in whole or in part, for the purpose of creating, operating, or contributing to a competing or derivative product or service.</p>
          <p>You further agree not to represent any content, feature, or output of this app as your own original work product outside the ordinary academic use for which it is provided (e.g., submitting the app itself, or substantial copies of its materials, as your own creation in a course, business, or publication). This restriction applies during and after your use of the service and survives termination of your account.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Content</h2>
          <p>Biblical texts are provided under their respective open licenses (SBLGNT, WEB, Brenton, etc.). Course materials created by instructors remain their intellectual property. The app&rsquo;s software, design, and original compiled content belong to the operator and are protected under Section 4 above.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Messaging Between Students</h2>
          <p>The messaging system lets you communicate with your instructor, and — if you choose to opt in — with other students enrolled in the same course. If you opt in, your email address is revealed to coursemates who message you, so they can continue the conversation outside the app if they wish. This setting is off by default and may be changed at any time in your account settings.</p>
          <p><strong>Regardless of this setting, administrators of Seminary Greek are able to view all messages sent through the platform</strong>, for moderation, safety, and support purposes. Do not send anything through the messaging system that you would not want an administrator to see.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">7. Acceptable Use</h2>
          <p>You agree to use the service only for lawful, educational purposes and not to attempt to disrupt, misuse, or gain unauthorized access to it or to other users&rsquo; accounts or data.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">8. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms, including violations of Section 4. You may delete your account at any time by contacting us; subscription fees already paid are non-refundable upon termination or voluntary account deletion.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">9. Disclaimer</h2>
          <p>The service is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any loss or damage arising from your use of Seminary Greek.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">10. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Michigan, without regard to its conflict-of-laws principles.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">11. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">12. Contact</h2>
          <p>Questions about these Terms can be directed to the site administrator.</p>
        </section>
      </div>
    </main>
  )
}
