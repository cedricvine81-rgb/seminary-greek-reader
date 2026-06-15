import type { Metadata } from 'next'
import { ExegesisWorkspace } from '@/components/student/ExegesisWorkspace'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

export const metadata: Metadata = { title: 'Exegesis Workspace' }

// Public standalone Exegesis Workspace (like the Reader / Vocab / Morphology tools).
// Anyone can open a passage and annotate it; saving requires sign-in — signed-out
// visitors get a "Sign in to save your work" prompt instead of the save status.
export default function PublicExegesisPage() {
  const token = getTokenFromCookies()
  const isAuthenticated = !!(token && verifyToken(token))

  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden print:h-auto print:overflow-visible w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <ExegesisWorkspace isAuthenticated={isAuthenticated} />
    </main>
  )
}
