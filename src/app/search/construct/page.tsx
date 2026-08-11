import type { Metadata } from 'next'
import { ConstructSearchPage } from '@/components/search/ConstructSearchPage'
import { decodeConstruct } from '@/lib/construct-query'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getServerLocale } from '@/lib/i18n/server'
import { loadContent } from '@/lib/i18n/content-load'

export const metadata: Metadata = { title: 'Construct search' }

// Construct search lives on its own route rather than as a scope of /search: the builder needs
// vertical room (two or three term cards), and this way the text-query search page is untouched.
// Criteria come straight off the URL (construct-query.ts), so a construct is a shareable link.
export default async function ConstructPage({ searchParams }: {
  searchParams: { c?: string; w?: string; ord?: string; sv?: string; books?: string }
}) {
  // Signed-in readers get the highlighter row in the results' right-click menu.
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))
  // The worked examples are curated teaching content, translated per string and fingerprinted
  // (src/lib/i18n/es/constructPresets.json). Loaded HERE, on the server, so an English reader is
  // handed the empty catalogue and downloads no Spanish.
  const translations = await loadContent(getServerLocale(), 'constructPresets')

  return (
    <div className="py-2 pb-16">
      <ConstructSearchPage initial={decodeConstruct(searchParams ?? {})} isAuthenticated={isAuthenticated} translations={translations} />
    </div>
  )
}
