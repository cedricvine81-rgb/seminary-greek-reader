import type { Metadata } from 'next'
import { GreekReader } from '@/components/reader/GreekReader'
import { LandingHero } from '@/components/landing/LandingHero'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Greek Text Reader' }

export default function HomePage() {
  // First-time / logged-out visitors get the landing page (free tools + the $10/year
  // account). Signed-in users drop straight into the Reader, as before.
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    return <LandingHero />
  }

  return (
    <div className="reader-container-h flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-1 pb-4 max-w-5xl mx-auto w-full">
      <GreekReader userRole={payload.role} />
    </div>
  )
}
