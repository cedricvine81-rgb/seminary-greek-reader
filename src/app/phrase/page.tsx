import type { Metadata } from 'next'
import { PhraseExplorer } from '@/components/phrase/PhraseExplorer'

export const metadata: Metadata = { title: 'Phrase Explorer' }

export default function PhrasePage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-4xl mx-auto w-full">
      <PhraseExplorer />
    </div>
  )
}
