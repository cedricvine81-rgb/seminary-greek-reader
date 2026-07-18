import type { Metadata } from 'next'
import { VocabPageClient } from './VocabPageClient'

export const metadata: Metadata = { title: 'Vocab Builder' }

export default function VocabPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <VocabPageClient />
    </main>
  )
}
