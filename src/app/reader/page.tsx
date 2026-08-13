import type { Metadata } from 'next'
import { getServerTrack } from '@/lib/track-server'
import { GreekReader } from '@/components/reader/GreekReader'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// The Reader serves both corpora; the title follows the language track so a Hebrew
// student's tab and bookmarks read "Hebrew Text Reader". See src/lib/track.ts.
export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerTrack() === 'hebrew' ? 'Hebrew Text Reader' : 'Greek Text Reader' }
}

export default function ReaderPage({ searchParams }: { searchParams: { ref?: string; q?: string; tl?: string; corpus?: string } }) {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  // On the Hebrew track the Reader opens on the MT rather than the Greek NT. An explicit
  // ?corpus= always wins, so links and "Return to page" are unaffected.
  const initialCorpus = searchParams?.corpus
    ?? (getServerTrack() === 'hebrew' ? 'MT' : undefined)

  return (
    <div
      className="reader-container-h flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-4 pb-4 max-w-5xl mx-auto w-full"
    >
      <GreekReader initialRef={searchParams?.ref} initialHighlight={searchParams?.q} initialTransLang={searchParams?.tl} initialCorpus={initialCorpus} isAuthenticated={!!payload} userRole={payload?.role} />
    </div>
  )
}
