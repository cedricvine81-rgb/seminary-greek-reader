import type { Metadata } from 'next'
import { getServerTrack } from '@/lib/track-server'
import { GreekReader } from '@/components/reader/GreekReader'
import { LandingHero } from '@/components/landing/LandingHero'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// The Reader serves both corpora; the title follows the language track so a Hebrew
// student's tab and bookmarks read "Hebrew Text Reader". See src/lib/track.ts.
export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerTrack() === 'hebrew' ? 'Hebrew Text Reader' : 'Greek Text Reader' }
}

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
      {/* Signed-in landing drops straight into the Reader — on the MT for a Hebrew-track reader. */}
      <GreekReader userRole={payload.role} initialCorpus={getServerTrack() === 'hebrew' ? 'MT' : undefined} />
    </div>
  )
}
