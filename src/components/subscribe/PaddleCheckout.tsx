'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { initializePaddle, CheckoutEventNames, type Paddle } from '@paddle/paddle-js'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, Loader2 } from 'lucide-react'

const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_STUDENT_ANNUAL ?? ''
const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ''
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox'

// How long to keep polling for the webhook to land after Paddle reports the
// checkout as complete, before giving up and telling the student to refresh.
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30_000

type Phase = 'idle' | 'opening' | 'processing' | 'timed-out' | 'error'

export function PaddleCheckout({ userId, email }: { userId: string; email: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const paddleRef = useRef<Paddle | undefined>(undefined)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stop polling if the student navigates away mid-activation.
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  useEffect(() => {
    if (!CLIENT_TOKEN) {
      setError('Checkout is not configured yet — missing Paddle client token.')
      setPhase('error')
      return
    }
    initializePaddle({
      environment: ENVIRONMENT,
      token: CLIENT_TOKEN,
      eventCallback: event => {
        if (event.name === CheckoutEventNames.CHECKOUT_COMPLETED) {
          setPhase('processing')
          pollForActivation()
        } else if (event.name === CheckoutEventNames.CHECKOUT_CLOSED) {
          // Only bounce back to idle if we were still waiting on the popup — never
          // stomp on 'processing'/'timed-out' if the close event arrives after completion.
          setPhase(prev => (prev === 'opening' ? 'idle' : prev))
        } else if (event.name === CheckoutEventNames.CHECKOUT_ERROR) {
          setError('Something went wrong during checkout. Please try again.')
          setPhase('error')
        }
      },
    }).then(instance => { paddleRef.current = instance })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pollForActivation() {
    const startedAt = Date.now()
    if (pollRef.current) clearInterval(pollRef.current)
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/subscription')
        const data = await res.json().catch(() => ({}))
        if (data.status === 'ACTIVE' || data.status === 'GRANDFATHERED') {
          clearInterval(interval)
          router.push('/student')
          router.refresh()
          return
        }
      } catch {
        // ignore transient network errors and keep polling until the timeout
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        clearInterval(interval)
        setPhase('timed-out')
      }
    }, POLL_INTERVAL_MS)
    pollRef.current = interval
  }

  function openCheckout() {
    if (!paddleRef.current || !PRICE_ID) {
      setError('Checkout is not configured yet — missing Paddle price ID.')
      setPhase('error')
      return
    }
    setPhase('opening')
    paddleRef.current.Checkout.open({
      items: [{ priceId: PRICE_ID, quantity: 1 }],
      customer: { email },
      customData: { userId },
      settings: { displayMode: 'overlay', theme: 'light' },
    })
  }

  if (phase === 'processing') {
    return (
      <div className="text-center py-8 space-y-3">
        <Loader2 size={32} className="mx-auto animate-spin text-brand-600" />
        <p className="text-sm text-gray-600">Payment received — activating your account…</p>
      </div>
    )
  }

  if (phase === 'timed-out') {
    return (
      <div className="text-center py-8 space-y-3">
        <CheckCircle2 size={32} className="mx-auto text-green-500" />
        <p className="text-sm text-gray-700">
          Your payment went through. Activation is taking a little longer than usual —
          try refreshing this page in a moment.
        </p>
        <Button onClick={() => window.location.reload()} size="sm">Refresh</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <Button onClick={openCheckout} loading={phase === 'opening'} className="w-full" size="lg">
        Subscribe — $10/year
      </Button>
      <p className="text-xs text-gray-400 text-center">
        Billed annually. Taxes may apply and will be calculated at checkout. No refunds — see our{' '}
        <a href="/refunds" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Refund Policy</a>.
      </p>
    </div>
  )
}
