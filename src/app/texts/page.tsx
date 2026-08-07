import type { Metadata } from 'next'
import { TextsReader } from '@/components/texts/TextsReader'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import type { OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { getServerLocale } from '@/lib/i18n/server'
import { loadContent } from '@/lib/i18n/content-load'
import { ContentProvider } from '@/lib/i18n/ContentProvider'

export const metadata: Metadata = { title: 'Texts' }

// Standalone library of ancient texts (Septuagint, Josephus, Philo, the Fathers, …). Promoted
// out of the Exegesis workspace into its own top-level page + header nav item. `?work=<id>`
// opens a work (the header Texts menu links here); `?open=<encoded target>` opens a specific
// passage (the Backgrounds "open in Texts" hand-off and background-search results).
export default async function TextsPage({ searchParams }: { searchParams: { work?: string; open?: string } }) {
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  let openRequest: { target: OpenInTextsTarget; token: number } | null = null
  if (searchParams?.open) {
    try { openRequest = { target: JSON.parse(searchParams.open) as OpenInTextsTarget, token: 1 } } catch { /* ignore malformed */ }
  }

  // The "Summary" popover's five sections are curated content, translated per section and
  // loaded here for the reader's language only. English is given the empty catalogue.
  const summaries = await loadContent(getServerLocale(), 'summaries')

  return (
    <main className="reader-container-h flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-4 pb-4 max-w-7xl mx-auto w-full">
      <ContentProvider catalogue={summaries}>
        <TextsReader isAuthenticated={isAuthenticated} initialWorkId={searchParams?.work} openRequest={openRequest} />
      </ContentProvider>
    </main>
  )
}
