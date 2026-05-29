import type { Metadata } from 'next'
import { MorphologyView } from '@/components/vocab/MorphologyView'

export const metadata: Metadata = { title: 'Morphology' }

export default function MorphologyPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MorphologyView />
      </div>
    </main>
  )
}
