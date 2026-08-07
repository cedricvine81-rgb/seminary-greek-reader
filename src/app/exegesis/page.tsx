import type { Metadata } from 'next'
import { ExegesisTabs } from '@/components/student/ExegesisTabs'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { getServerLocale } from '@/lib/i18n/server'
import { loadContent } from '@/lib/i18n/content-load'
import { ContentProvider } from '@/lib/i18n/ContentProvider'

export const metadata: Metadata = { title: 'Exegesis Workspace' }

// Public standalone Exegesis Workspace (like the Reader / Vocab / Morphology tools).
// Anyone can open a passage and annotate it; saving requires sign-in — signed-out
// visitors get a "Sign in to save your work" prompt instead of the save status.
// The Rhetoric tab's figure catalogue is curated content, translated per string. It is loaded
// HERE, on the server, for the reader's language only, and provided to the client tree —
// RhetoricView is several levels down, so a prop would have to cross components that have
// nothing to do with i18n. An English reader is given the empty catalogue and downloads no
// translation at all.
export default async function PublicExegesisPage({ searchParams }: { searchParams: { tab?: string; open?: string; ref?: string } }) {
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  const rhetoric = await loadContent(getServerLocale(), 'rhetoric')

  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden print:h-auto print:overflow-visible w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <ContentProvider catalogue={rhetoric}>
        <ExegesisTabs isAuthenticated={isAuthenticated} initialTab={searchParams?.tab} initialOpen={searchParams?.open} initialRef={searchParams?.ref} />
      </ContentProvider>
    </main>
  )
}
