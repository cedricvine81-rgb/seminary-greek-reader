import type { Locale } from './locale'
import { NO_CONTENT, type ContentCatalogue } from './content'

/**
 * Loads the translated content for one surface in one language, on the SERVER, so the page can
 * hand it to its client component as a prop.
 *
 * Every import here is dynamic and every catalogue is split by surface. Both matter:
 *
 *   · dynamic, so English costs nothing. A static import would put the Spanish in the same
 *     bundle as the code that reads it, and every English reader would download all of it.
 *   · per surface, so a reader of /themes is not also served the morphology chapters. The
 *     content corpus is ~97,000 words; it is only ever read a few thousand at a time.
 *
 * An unknown locale or an untranslated surface returns the empty catalogue, which makes
 * content() fall back to English — the same path a partial translation takes.
 */
export type ContentSource = 'themes'

export async function loadContent(
  locale: Locale, source: ContentSource,
): Promise<ContentCatalogue> {
  if (locale === 'en') return NO_CONTENT
  if (locale === 'es' && source === 'themes') {
    return (await import('./generated/es.themes')).ES_THEMES
  }
  return NO_CONTENT
}
