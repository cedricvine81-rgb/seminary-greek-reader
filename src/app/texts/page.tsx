import type { Metadata } from 'next'
import { TextsReader } from '@/components/texts/TextsReader'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Texts' }

// Public reading library — Josephus, the Apocrypha (Greek + English), and the Septuagint
// OT, in a Reader-style view. Signed-in users can also take per-verse notes.
export default function TextsPage() {
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
      <TextsReader isAuthenticated={isAuthenticated} />
    </main>
  )
}
