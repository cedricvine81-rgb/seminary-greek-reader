'use client'
import { content, NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'
import { glossKey, duplicatedLemmas } from '@/lib/vocab-gloss-key'

/**
 * The deck gloss for a lexeme, in the reader's language, resolved in the browser.
 *
 * The reader's parsing pane shows a gloss for every word a student clicks, and those glosses
 * already exist in Spanish — 1,120 for Greek and 1,036 for Hebrew, frequency-ordered, so they
 * cover about 90% of running New Testament text. They were simply never wired to this surface:
 * the pane read VOCAB_GLOSSES, a static English map.
 *
 * TWO FILES, not one, and that is the point. The catalogue holds {fp, text}; the fp is a
 * fingerprint of the English the translation was made from, and content() only returns the
 * Spanish when the two still agree. Verifying that needs the English, so the build emits the
 * deck's own glosses beside the catalogue. Taking `text` on its own would be smaller and would
 * silently show a stale gloss the first time the English was edited — the one thing this whole
 * translation effort has been built not to do.
 *
 * VOCAB_GLOSSES cannot stand in for the English half: it is a different, fuller gloss set
 * ("he, she, it, himself, herself, itself; even, very; same" against the deck's "he, she, it;
 * same"), so its fingerprints would never match and every lookup would fall back.
 *
 * Both files are fetched once per deck and cached for the session. An English reader fetches
 * NEITHER — resolverFor() returns a resolver that never asks for them.
 */
export type Deck = 'greek' | 'hebrew'
export type GlossResolver = (lexeme: string) => string | null

const cache = new Map<string, Promise<GlossResolver>>()

/** Lemmas differing only by NFC normalisation must still match — the decks mix OXIA and TONOS. */
const nfc = (s: string) => s.normalize('NFC')

/** Strip diacritics, so a lexeme carrying a different accent still finds its entry. */
const bare = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')

async function build(locale: string, deck: Deck): Promise<GlossResolver> {
  const [cat, english] = await Promise.all([
    fetch(`/data/vocab/${locale}/${deck}.json`).then(r => (r.ok ? r.json() : NO_CONTENT)).catch(() => NO_CONTENT),
    fetch(`/data/vocab/${deck}.en.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})),
  ]) as [ContentCatalogue, Record<string, string>]

  const words = Object.entries(english).map(([word, gloss]) => ({ word, gloss }))
  const dup = duplicatedLemmas(words)
  // Accent-insensitive index, so a lexeme spelled with a different accent still resolves. Built
  // once; only the first spelling of a bare form wins, which is what the deck itself assumes.
  const byBare = new Map<string, string>()
  for (const w of words) if (!byBare.has(bare(w.word))) byBare.set(bare(w.word), w.word)

  return (lexeme: string) => {
    if (!lexeme) return null
    const lemma = byBare.get(bare(nfc(lexeme))) ?? nfc(lexeme)
    const eng = english[lemma]
    if (eng === undefined) return null            // not in the deck at all
    const out = content(cat, glossKey(deck, lemma, eng, dup), eng)
    // content() returns the English when there is no translation or the fingerprint is stale.
    // Report that as "no Spanish gloss" so the caller can fall back to its own English source
    // rather than showing the deck's English under a Spanish label.
    return out === eng ? null : out
  }
}

/** A resolver for one deck and locale. English gets a resolver that fetches nothing. */
export function resolverFor(locale: string, deck: Deck): Promise<GlossResolver> {
  if (locale === 'en') return Promise.resolve(() => null)
  const k = `${locale}.${deck}`
  let p = cache.get(k)
  if (!p) { p = build(locale, deck); cache.set(k, p) }
  return p
}
