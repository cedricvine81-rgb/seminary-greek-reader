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
export type ContentSource = 'themes' | 'rhetoric' | 'summaries' | 'constructPresets' | 'pageGuides' | 'registerBackground'

export async function loadContent(
  locale: Locale, source: ContentSource,
): Promise<ContentCatalogue> {
  if (locale === 'en') return NO_CONTENT
  if (locale === 'es' && source === 'themes') {
    return (await import('./generated/es.themes')).ES_THEMES
  }
  if (locale === 'es' && source === 'rhetoric') {
    return (await import('./generated/es.rhetoric')).ES_RHETORIC
  }
  if (locale === 'es' && source === 'summaries') {
    return (await import('./generated/es.summaries')).ES_SUMMARIES
  }
  if (locale === 'es' && source === 'constructPresets') {
    return (await import('./generated/es.constructPresets')).ES_CONSTRUCTPRESETS
  }
  // The page guides are the one surface loaded from a CLIENT component — the panel is mounted
  // app-wide, so there is no server render to hand it a catalogue. The dynamic import does the
  // same work either way: Next splits it out, and an English reader never fetches the chunk.
  if (locale === 'es' && source === 'pageGuides') {
    return (await import('./generated/es.pageGuides')).ES_PAGEGUIDES
  }
  if (locale === 'es' && source === 'registerBackground') {
    return (await import('./generated/es.registerBackground')).ES_REGISTERBACKGROUND
  }
  return NO_CONTENT
}
