import type { Metadata } from 'next'
import { GreekReader } from '@/components/reader/GreekReader'
import { LandingHero } from '@/components/landing/LandingHero'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Greek Text Reader' }

export default function HomePage() {
  // First-time / logged-out visitors get the landing page (free tools + the $10/year
  // account). Signed-in users drop straight into the Reader, as before.
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  if (!isAuthenticated) {
    return <LandingHero />
  }

  return (
    <div
      className="flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-1 pb-4 max-w-5xl mx-auto w-full"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    >
      <GreekReader />
    </div>
  )
}
