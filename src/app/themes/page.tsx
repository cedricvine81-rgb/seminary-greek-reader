import type { Metadata } from 'next'
import { ThemesView } from '@/components/themes/ThemesView'

export const metadata: Metadata = { title: 'Themes' }

// A topic index over the Texts library. The corpora are searchable by author and by word already;
// this is the third axis — by subject — and it is the one a seminary question actually starts
// from. Content is curated in src/lib/themes.ts against passages that retrieval really
// returned (scripts/build-themes.ts); no citation here is model-recalled.
export default function ThemesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <main className="w-full">
      <ThemesView topicId={searchParams?.topic ?? 'resurrection'} />
    </main>
  )
}
