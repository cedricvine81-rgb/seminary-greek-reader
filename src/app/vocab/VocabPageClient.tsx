'use client'
import { useState } from 'react'
import { VocabBuilder, type VocabLang } from '@/components/vocab/VocabBuilder'

export function VocabPageClient() {
  const [lang, setLang] = useState<VocabLang>('greek')
  // key={lang} remounts the builder on switch so per-language state (config, session,
  // progress) starts fresh instead of leaking across decks.
  return <VocabBuilder key={lang} lang={lang} onLangChange={setLang} />
}
