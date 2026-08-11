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
  // Three files: the deck's translations and its English, plus the LEXICON layer — a short gloss
  // for the ~4,300 New Testament lemmas the deck does not carry. The deck is a curated course
  // list and wins where the two overlap; the lexicon covers the long tail of rarer words that
  // used to fall through to English entirely.
  const [cat, english, lexCat] = await Promise.all([
    fetch(`/data/vocab/${locale}/${deck}.json`).then(r => (r.ok ? r.json() : NO_CONTENT)).catch(() => NO_CONTENT),
    fetch(`/data/vocab/${deck}.en.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({})),
    deck === 'greek'
      ? fetch(`/data/lexicon-gloss/${locale}/greek.json`).then(r => (r.ok ? r.json() : NO_CONTENT)).catch(() => NO_CONTENT)
      : Promise.resolve(NO_CONTENT),
  ]) as [ContentCatalogue, Record<string, string>, ContentCatalogue]

  const words = Object.entries(english).map(([word, gloss]) => ({ word, gloss }))
  const dup = duplicatedLemmas(words)
  // Accent-insensitive index, so a lexeme spelled with a different accent still resolves. Built
  // once; only the first spelling of a bare form wins, which is what the deck itself assumes.
  const byBare = new Map<string, string>()
  for (const w of words) if (!byBare.has(bare(w.word))) byBare.set(bare(w.word), w.word)

  // The lexicon layer is keyed by the lemma exactly as the corpus spells it, and holds {fp,text}
  // like every other catalogue — but the English it fingerprints lives in the same entry's key
  // space rather than a second file, so it is read back through the catalogue itself.
  const lexBare = new Map<string, string>()
  for (const k of Object.keys(lexCat)) {
    const lemma = k.slice('lex.gloss.'.length)
    if (!lexBare.has(bare(lemma))) lexBare.set(bare(lemma), k)
  }

  return (lexeme: string) => {
    if (!lexeme) return null
    const raw = nfc(lexeme)

    // 1. The deck, which carries the teaching gloss and wins where it has one.
    const lemma = byBare.get(bare(raw)) ?? raw
    const eng = english[lemma]
    if (eng !== undefined) {
      const out = content(cat, glossKey(deck, lemma, eng, dup), eng)
      // content() returns the English when there is no translation or the fingerprint is stale.
      // Report that as "no Spanish gloss" so the caller falls back to its own English source
      // rather than showing the deck's English under a Spanish label.
      if (out !== eng) return out
    }

    // 2. The lexicon layer, for everything else.
    const lexKey = lexBare.get(bare(raw))
    const hit = lexKey ? (lexCat as Record<string, { fp: string; text: string } | undefined>)[lexKey] : undefined
    return hit?.text ?? null
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
