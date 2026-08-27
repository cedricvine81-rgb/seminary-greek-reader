import type { Metadata } from 'next'
import { SearchPageView } from '@/components/search/SearchPageView'
import { MorphSearchPage } from '@/components/search/MorphSearchPage'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Search' }

// The full-page Master Search. Reached from the header icon / ⌘K / the right-click word menu
// (all via MasterSearchProvider → router.push('/search?…')). `q` pre-fills the query, `in` the
// scope (e.g. greek:GNT, trans:en, bg:josephus). The morphology facet (in=morph:<corpus>, +features)
// is its own isolated page component.
export default function SearchPage({ searchParams }: { searchParams: { q?: string; in?: string; mode?: string; books?: string; from?: string; features?: string; strongs?: string } }) {
  // Signed-in readers get the highlighter row in the results' right-click menu.
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  if (searchParams?.in?.startsWith('morph:')) {
    return (
      <div className="py-2 pb-16">
        <MorphSearchPage
          features={(searchParams.features ?? '').split(',').map(f => f.trim()).filter(Boolean)}
          lemma={(searchParams.q ?? '').trim()}
          corpus={((searchParams.in ?? '').slice(6) || 'GNT') as 'GNT' | 'LXX' | 'BOTH'}
          returnTo={searchParams.from}
        />
      </div>
    )
  }
  return (
    <div className="py-2 pb-16">
      <SearchPageView
        initialQuery={searchParams?.q}
        initialScope={searchParams?.in}
        initialLemma={searchParams?.mode === 'lemma'}
        initialBooks={searchParams?.books}
        initialStrongs={searchParams?.strongs}
        returnTo={searchParams?.from}
        isAuthenticated={isAuthenticated}
      />
    </div>
  )
}
