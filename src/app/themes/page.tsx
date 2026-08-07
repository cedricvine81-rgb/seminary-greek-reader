import type { Metadata } from 'next'
import { ThemesView } from '@/components/themes/ThemesView'
import { getServerLocale } from '@/lib/i18n/server'
import { loadContent } from '@/lib/i18n/content-load'

export const metadata: Metadata = { title: 'Themes' }

// A topic index over the Texts library. The corpora are searchable by author and by word already;
// this is the third axis — by subject — and it is the one a seminary question actually starts
// from. Content is curated in src/lib/themes.ts against passages that retrieval really
// returned (scripts/build-themes.ts); no citation here is model-recalled.
// The curated prose is translated per string (src/lib/i18n/es/themes.json). The catalogue for
// the reader's language is loaded HERE, on the server, and passed down — an English reader gets
// the empty one, so no translation is shipped to a browser that will not display it.
export default async function ThemesPage({ searchParams }: { searchParams: { topic?: string } }) {
  const translations = await loadContent(getServerLocale(), 'themes')
  return (
    <main className="w-full">
      <ThemesView topicId={searchParams?.topic ?? 'resurrection'} translations={translations} />
    </main>
  )
}
