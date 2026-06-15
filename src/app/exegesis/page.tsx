import type { Metadata } from 'next'
import { ExegesisWorkspace } from '@/components/student/ExegesisWorkspace'

export const metadata: Metadata = { title: 'Exegesis Workspace' }

// Public standalone Exegesis Workspace (like the Reader / Vocab / Morphology tools).
// Anyone can open a passage and annotate it; saving sessions requires sign-in
// (the save controls fail gracefully when signed out).
export default function PublicExegesisPage() {
  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden print:h-auto print:overflow-visible w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ExegesisWorkspace />
    </main>
  )
}
