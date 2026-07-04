import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pricing' }

export default function PricingPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/auth/sign-up" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back to sign up</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pricing</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="rounded-xl border border-parchment-200 bg-parchment-50 p-8 mb-10">
        <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">Seminary Greek — Student Subscription</p>
        <p className="text-4xl font-bold text-gray-900 mb-1">
          $10<span className="text-lg font-normal text-gray-500"> / year (USD)</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">Per student account, billed annually. No free trial.</p>
        <ul className="space-y-2 text-sm text-gray-700 mb-6">
          <li>&bull; Full Greek New Testament and Septuagint reader</li>
          <li>&bull; Vocabulary and morphology quizzes</li>
          <li>&bull; Instructor-created Translation Exercises and Exams</li>
        </ul>
        <p className="text-xs text-gray-400">Taxes may apply and will be calculated at checkout.</p>
      </div>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. Student Subscription</h2>
          <p>New student accounts require a subscription of <strong>$10 per year (USD)</strong> to access Seminary Greek. The subscription covers the Greek NT/LXX reader, vocabulary and morphology quizzes, and instructor-created Translation Exercises and Exams for as long as the subscription remains active. This is the same price shown at checkout — we do not display a different price on this page than what Paddle charges.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. Billing</h2>
          <p>Payment is charged immediately upon sign-up; there is no free trial or introductory discount. The subscription then renews automatically once a year at the same $10 rate unless cancelled beforehand. Billing and payment collection are handled entirely by <strong>Paddle.com</strong>, our Merchant of Record. Taxes (such as sales tax or VAT, where applicable) are not included in the $10 price shown above — they are calculated based on your location and added at checkout. See our <Link href="/refunds" className="text-brand-600 hover:underline">Refund Policy</Link> for details on cancellations and non-refundable payments.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">3. How to Cancel</h2>
          <p>You can cancel automatic renewal at any time by signing in and going to <strong>Settings → Subscription → Cancel Subscription</strong>. Cancelling stops future billing only — you keep full access through the end of your current paid period, and no refund is issued for time already paid. See our <Link href="/refunds" className="text-brand-600 hover:underline">Refund Policy</Link> for full details.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">4. Instructors and Administrators</h2>
          <p>Instructor and administrator accounts are not subject to this subscription fee.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Existing Students</h2>
          <p>Student accounts created before this pricing policy took effect are grandfathered and retain full access at no charge.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Changes to Pricing</h2>
          <p>We may change the subscription price or terms for future billing periods. Any change will be reflected on this page before it takes effect. See our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link> for the rest of our policies.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">7. Contact</h2>
          <p>Questions about pricing can be directed to the site administrator.</p>
        </section>
      </div>
    </main>
  )
}
