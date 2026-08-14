'use client'
import { useEffect, useMemo, useState } from 'react'
import { content, NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'
import { glossKey, duplicatedLemmas } from '@/lib/vocab-gloss-key'
import { DECKS, type VocabLang, type DeckWord } from '@/lib/vocab-decks'

/**
 * A deck word's gloss in the reader's language.
 *
 * EXTRACTED BECAUSE THE ALTERNATIVE KEPT LOSING. Every surface that shows deck words needs
 * this, and each one that reimplemented it — or simply rendered `w.gloss` — silently served
 * English to Spanish readers while the catalogue sat there complete and the audits reported
 * 100%. The flashcard did exactly that: 1,036 correct Spanish glosses, and the card printed
 * the deck's raw English beside a fully Spanish frame. One hook, so a new surface gets the
 * behaviour by using it rather than by remembering to.
 *
 * The fingerprint rule is content()'s: a gloss whose English was edited since the Spanish
 * was made falls back to the English rather than showing something stale.
 *
 * An English reader fetches nothing.
 */
const cache: Record<string, ContentCatalogue> = {}
const inflight: Record<string, Promise<ContentCatalogue>> = {}

function loadDeckGlosses(locale: string, deck: VocabLang): Promise<ContentCatalogue> {
  const k = `${locale}.${deck}`
  if (cache[k]) return Promise.resolve(cache[k])
  if (!inflight[k]) {
    inflight[k] = fetch(`/data/vocab/${locale}/${deck}.json`)
      .then(r => (r.ok ? r.json() : NO_CONTENT))
      .then((d: ContentCatalogue) => (cache[k] = d))
      .catch(() => (cache[k] = NO_CONTENT))
  }
  return inflight[k]
}

export function useDeckGloss(locale: string, lang: VocabLang): (w: DeckWord) => string {
  const [cat, setCat] = useState<ContentCatalogue>(NO_CONTENT)

  useEffect(() => {
    if (locale === 'en') { setCat(NO_CONTENT); return }
    let alive = true
    loadDeckGlosses(locale, lang).then(c => { if (alive) setCat(c) })
    return () => { alive = false }
  }, [locale, lang])

  // Homographs key by lemma + fingerprint; the set of duplicated lemmas is per deck.
  const dup = useMemo(() => duplicatedLemmas(DECKS[lang].words), [lang])

  return useMemo(
    () => (w: DeckWord) => content(cat, glossKey(lang, w.word, w.gloss, dup), w.gloss),
    [cat, lang, dup],
  )
}
