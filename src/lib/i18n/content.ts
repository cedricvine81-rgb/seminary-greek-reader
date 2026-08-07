/**
 * Translations of the app's own TEACHING CONTENT — the Themes prose, the morphology chapters,
 * the text summaries — as distinct from interface chrome, which lives in messages.ts.
 *
 * Two reasons they cannot share a mechanism:
 *
 *   · SCALE. There are ~265 interface strings and ~97,000 words of content. A catalogue held in
 *     memory for every visitor is right for the first and wrong for the second.
 *   · STALENESS. Interface labels almost never change. Content changes constantly — themes.ts
 *     was edited a dozen times in a single day — and a translation of a paragraph that has since
 *     been rewritten is worse than no translation, because it silently teaches the old thing.
 *
 * So every translation stores a FINGERPRINT of the English it was made from. If the English has
 * changed since, the translation is stale and the reader gets the English instead. A missing
 * translation and an outdated one behave identically: fall back, never mislead.
 *
 * ENGLISH IS NEVER TOUCHED, in two senses. The source files keep their English inline — nothing
 * is moved into a catalogue, so the English rendering path is what it always was. And an English
 * reader is served an EMPTY catalogue (see content-load.ts), so no translated text is downloaded,
 * parsed or held for a language they are not reading. Adding a language must not make the app
 * heavier for everyone who does not use it.
 */

/** FNV-1a, 32-bit. Not cryptographic — it only has to change when the text does. */
export function fingerprint(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

/** A translated string, with the fingerprint of the English it was made from. */
export interface Translated { fp: string; text: string }
export type ContentCatalogue = Record<string, Translated>

export const NO_CONTENT: ContentCatalogue = {}

/**
 * The `key`'s translation, or `english` when there is none and when the one there is has gone
 * stale. `english` is always the fallback, so a page half-translated reads as a mixture rather
 * than breaking — which is what makes it safe to ship a translation in progress.
 *
 * The catalogue is passed in rather than looked up by locale: it is chosen on the server, so an
 * English reader is given the empty one and this reduces to returning its own argument.
 */
export function content(cat: ContentCatalogue, key: string, english: string): string {
  const entry = cat[key]
  if (!entry) return english
  return entry.fp === fingerprint(english) ? entry.text : english
}
