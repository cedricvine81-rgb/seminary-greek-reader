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
          <h2 className="text-base font-semibold text-gray-900 mb-2">1. 14-Day Refund Window</h2>
          <p>You may request a <strong>full refund of any Seminary Greek subscription payment within 14 days</strong> of that payment being taken — for any reason, and without having to give one. This applies to your initial purchase and to each annual renewal charge, and is counted from the date the payment was charged.</p>
          <p>Approved refunds are returned to the original payment method. Once a refund is issued, the subscription it paid for ends and access to paid features stops.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">2. How to Request a Refund</h2>
          <p>Because <strong>Paddle.com</strong> is the Merchant of Record for every Seminary Greek transaction, refunds are issued by Paddle. To request one within the 14-day window, either:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>contact Paddle&rsquo;s buyer support at <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">paddle.net</a> with the email address and order reference from your receipt; or</li>
            <li>contact the site administrator and we will pass the request to Paddle on your behalf.</li>
          </ul>
          <p>This policy meets or exceeds the minimum refund period required by <a href="https://www.paddle.com/legal/buyer-terms" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Paddle&rsquo;s Buyer Terms</a>, which also govern your purchase.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">3. After the 14-Day Window</h2>
          <p>Once 14 days have passed since a payment, that payment is non-refundable except where applicable law or Paddle&rsquo;s Buyer Terms require otherwise. That includes an unused or partial subscription period, a renewal you forgot to cancel more than 14 days after it was charged, or termination of an account for violating our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>. You can always cancel automatic renewal to prevent future charges — see below.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">4. Cancelling Your Subscription</h2>
          <p>You may cancel automatic renewal at any time from your account Settings page. Cancelling stops future billing and keeps your access through the end of the billing period you already paid for; access then ends and does not renew.</p>
          <p>Cancelling is separate from refunding. If you are still within 14 days of a charge and want that charge returned rather than simply stopping future ones, request a refund as described in Section&nbsp;2.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">5. Billing &amp; Payment Processor</h2>
          <p>All subscription payments are billed and processed by <strong>Paddle.com</strong>, which acts as the Merchant of Record for every transaction. Paddle handles checkout, payment collection, refunds, and related customer support for billing issues (such as a duplicate charge or a payment method error). Paddle may also, at its discretion and in accordance with its own policies and applicable law, correct a billing error or resolve a payment dispute.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">6. Legally Required Exceptions</h2>
          <p>Where applicable law grants you a mandatory right to a refund, cancellation, or withdrawal that cannot be waived by agreement — such as a statutory cooling-off period — this policy does not limit that right, and any such right applies in addition to the 14-day window described above.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">7. Governing Law</h2>
          <p>This policy is governed by the laws of the State of Michigan, without regard to its conflict-of-laws principles, consistent with our <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">8. Contact</h2>
          <p>Questions about a charge or this policy can be directed to the site administrator. For payment-method-specific issues or to request a refund directly, you may also contact Paddle as the processor of your transaction.</p>
        </section>
      </div>
    </main>
  )
}
