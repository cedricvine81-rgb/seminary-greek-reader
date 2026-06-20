import type { Metadata } from 'next'
import { PhraseExplorer } from '@/components/phrase/PhraseExplorer'

export const metadata: Metadata = { title: 'Phrase Explorer' }

export default function PhrasePage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-4xl mx-auto w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Phrase Explorer</h1>
      <p className="text-sm text-gray-500 mb-4">
        Explore the syntactic structure of the Greek text — clauses, phrases, and word groups.
      </p>
      <PhraseExplorer />
    </div>
  )
}
