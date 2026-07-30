import type { Metadata } from 'next'
import { ConstructSearchPage } from '@/components/search/ConstructSearchPage'
import { decodeConstruct } from '@/lib/construct-query'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Construct search' }

// Construct search lives on its own route rather than as a scope of /search: the builder needs
// vertical room (two or three term cards), and this way the text-query search page is untouched.
// Criteria come straight off the URL (construct-query.ts), so a construct is a shareable link.
export default function ConstructPage({ searchParams }: {
  searchParams: { c?: string; w?: string; ord?: string; sv?: string; books?: string }
}) {
  // Signed-in readers get the highlighter row in the results' right-click menu.
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  return (
    <div className="py-2 pb-16">
      <ConstructSearchPage initial={decodeConstruct(searchParams ?? {})} isAuthenticated={isAuthenticated} />
    </div>
  )
}
