'use client'
import { useState } from 'react'
import { VocabBuilder, type VocabLang } from '@/components/vocab/VocabBuilder'
import { useTrackValue } from '@/lib/track-client'

export function VocabPageClient() {
  // Open on the deck for the current brand — a Hebrew-track student should not have to
  // switch every visit. This is only the DEFAULT: the builder's own Greek/Hebrew switch
  // still works, and changing it here does not change the header brand.
  const track = useTrackValue()
  const [lang, setLang] = useState<VocabLang>(track === 'hebrew' ? 'hebrew' : 'greek')
  // key={lang} remounts the builder on switch so per-language state (config, session,
  // progress) starts fresh instead of leaking across decks.
  return <VocabBuilder key={lang} lang={lang} onLangChange={setLang} />
}
