import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Refund Policy' }

export default function RefundsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/auth/sign-up" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back to sign up</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: July 2026</p>

      <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. No Refunds</h2>
          <p>The Seminary Greek student subscription ($10 per year) is <strong>non-refundable</strong>. This applies in every case, including but not limited to: voluntary cancellation, an unused or partial subscription period, a failed renewal payment that lapses access, or termination of an account for violating our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. Cancelling Your Subscription</h2>
          <p>You may cancel automatic renewal at any time from your account Settings page. Cancelling stops future billing only — it does not refund any amount already paid. You keep full access to Seminary Greek through the end of the billing period you already paid for; access ends at that period&rsquo;s expiration and does not renew.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">3. Billing &amp; Payment Processor</h2>
          <p>All subscription payments are billed and processed by <strong>Paddle.com</strong>, which acts as the Merchant of Record for every transaction. Paddle handles checkout, payment collection, and related customer support for billing issues (such as a duplicate charge or a payment method error). Paddle may, at its discretion and in accordance with its own policies and applicable law, correct a billing error or resolve a payment dispute — such action is independent of, and does not expand, the no-refunds policy stated above for subscription cancellations or lapses.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">4. Legally Required Exceptions</h2>
          <p>Where applicable law grants you a mandatory right to a refund or withdrawal that cannot be waived by agreement, this policy does not limit that right. Absent such a requirement, all payments are final.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Governing Law</h2>
          <p>This policy is governed by the laws of the State of Michigan, without regard to its conflict-of-laws principles, consistent with our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Contact</h2>
          <p>Questions about a charge or this policy can be directed to the site administrator. For payment-method-specific issues, you may also contact Paddle directly as the processor of your transaction.</p>
        </section>
      </div>
    </main>
  )
}
