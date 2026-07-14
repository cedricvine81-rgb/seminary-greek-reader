import type { Metadata } from 'next'
import { SearchPageView } from '@/components/search/SearchPageView'

export const metadata: Metadata = { title: 'Search' }

// The full-page Master Search. Reached from the header icon / ⌘K / the right-click word menu
// (all via MasterSearchProvider → router.push('/search?…')). `q` pre-fills the query, `in` the
// scope (e.g. greek:GNT, trans:en, bg:josephus).
export default function SearchPage({ searchParams }: { searchParams: { q?: string; in?: string; mode?: string; books?: string } }) {
  return (
    <div className="py-2 pb-16">
      <SearchPageView
        initialQuery={searchParams?.q}
        initialScope={searchParams?.in}
        initialLemma={searchParams?.mode === 'lemma'}
        initialBooks={searchParams?.books}
      />
    </div>
  )
}
