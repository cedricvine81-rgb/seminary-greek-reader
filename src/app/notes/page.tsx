import type { Metadata } from 'next'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { NotesPageView } from '@/components/notes/NotesPageView'

export const metadata: Metadata = { title: 'Notes' }

// Public standalone Notes page (like the Exegesis workspace it was lifted from): anyone can
// open it; the notebook itself asks signed-out visitors to sign in to see their notes.
export default function NotesPage() {
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  return (
    <main className="h-[calc(100vh-3.5rem)] overflow-y-auto print:h-auto print:overflow-visible w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <NotesPageView isAuthenticated={isAuthenticated} />
    </main>
  )
}
