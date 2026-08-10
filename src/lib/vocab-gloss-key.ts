import { fingerprint } from '@/lib/i18n/content'

/**
 * The catalogue key for one deck entry.
 *
 * Mirrors vocabItems() in scripts/i18n-content.ts EXACTLY — build, client and server all derive
 * the key, and if any of the three disagrees the gloss silently stays English.
 *
 *   · NFC, because the decks mix OXIA and TONOS for the same Greek letter.
 *   · a fingerprint suffix for HOMOGRAPHS — 19 Hebrew lemmas carry two unrelated senses (אֵת is
 *     the object marker and also "with"), and keyed by lemma alone only one could be translated.
 *
 * `duplicated` is the set of lemmas the deck lists more than once; callers build it once.
 */
export function glossKey(
  deck: 'greek' | 'hebrew', word: string, english: string, duplicated: Set<string>,
): string {
  const lemma = word.normalize('NFC')
  return duplicated.has(lemma)
    ? `vocab.gloss.${deck}.${lemma}~${fingerprint(english)}`
    : `vocab.gloss.${deck}.${lemma}`
}

/** Lemmas a deck lists more than once, NFC-normalised. */
export function duplicatedLemmas(words: { word: string }[]): Set<string> {
  const n = new Map<string, number>()
  for (const w of words) {
    const k = w.word.normalize('NFC')
    n.set(k, (n.get(k) ?? 0) + 1)
  }
  // Array.from rather than a spread: the project targets a JS level where iterating a Map
  // with a spread needs downlevelIteration (see feedback-typecheck-before-push).
  const out = new Set<string>()
  n.forEach((count, lemma) => { if (count > 1) out.add(lemma) })
  return out
}
