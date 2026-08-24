import type { Metadata } from 'next'
import { DiagrammingGuide } from '@/components/phrase/DiagrammingGuide'

export const metadata: Metadata = {
  title: 'How to Diagram',
  description: 'How to diagram a Greek or Hebrew passage with the Diagramming canvas — the tools, a worked example, and why diagramming is worth your time.',
}

// Public how-to for the Diagramming canvas (linked from the Diagramming tab's header).
export default function DiagrammingGuidePage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <DiagrammingGuide />
    </main>
  )
}
