import type { Metadata } from 'next'
import { TheologyView } from '@/components/theology/TheologyView'

export const metadata: Metadata = { title: 'Theology' }

// A topic index over the Texts library. The corpora are searchable by author and by word already;
// this is the third axis — by subject — and it is the one a seminary question actually starts
// from. Content is curated in src/lib/theology.ts against passages that retrieval really
// returned (scripts/build-theology.ts); no citation here is model-recalled.
export default function TheologyPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <main className="w-full">
      <TheologyView topicId={searchParams?.topic ?? 'resurrection'} />
    </main>
  )
}
