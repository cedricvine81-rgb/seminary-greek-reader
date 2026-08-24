import type { Metadata } from 'next'
import { MorphologyView } from '@/components/vocab/MorphologyView'
import { HebrewGrammarView } from '@/components/morphology/hebrew/HebrewGrammarView'
import { getServerTrack } from '@/lib/track-server'

// The Grammar follows the language track: Seminary Greek gets the Greek chapters,
// Seminary Hebrew the Hebrew ones. The header toggle flips between them — nothing is
// gated, since a Hebrew student revising Greek (or vice versa) is one click away.
export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerTrack() === 'hebrew' ? 'Hebrew Grammar' : 'Grammar' }
}

export default function MorphologyPage() {
  const hebrew = getServerTrack() === 'hebrew'
  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
        {hebrew ? <HebrewGrammarView /> : <MorphologyView />}
      </div>
    </main>
  )
}
