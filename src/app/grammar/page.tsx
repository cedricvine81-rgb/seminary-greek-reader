import type { Metadata } from 'next'
import { MorphologyView } from '@/components/vocab/MorphologyView'

export const metadata: Metadata = { title: 'Grammar' }

export default function MorphologyPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
        <MorphologyView />
      </div>
    </main>
  )
}
