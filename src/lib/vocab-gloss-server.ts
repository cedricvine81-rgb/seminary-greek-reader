import fs from 'node:fs'
import path from 'node:path'
import { content, NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'

/**
 * The deck gloss in a given language, resolved on the SERVER so a quiz's answer key can be
 * generated in the course's language.
 *
 * Why this exists separately from the client resolver in VocabBuilder: the vocab glosses are a
 * SPLIT content source (public/data/vocab/<loc>/<deck>.json, fetched by the browser for the deck
 * on screen). Assessment cannot use that — the answer key has to be fixed at generation time, on
 * the server, from the same catalogue the student will read.
 *
 * The fingerprint check is what makes this safe: if a gloss's English has been edited since the
 * translation was made, content() returns the English, and the answer key is generated in English
 * rather than from a stale Spanish gloss. An answer key is the last place to silently use an
 * out-of-date string.
 */
const cache = new Map<string, ContentCatalogue>()

function catalogue(locale: string, deck: 'greek' | 'hebrew'): ContentCatalogue {
  if (locale === 'en') return NO_CONTENT
  const key = `${locale}.${deck}`
  const hit = cache.get(key)
  if (hit) return hit
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'vocab', locale, `${deck}.json`)
    const cat = JSON.parse(fs.readFileSync(file, 'utf8')) as ContentCatalogue
    cache.set(key, cat)
    return cat
  } catch {
    cache.set(key, NO_CONTENT)   // untranslated deck or missing file — fall back to English
    return NO_CONTENT
  }
}

/**
 * A resolver for one language. Pass it into quiz generation; call it per word.
 * `locale` of 'en' returns the deck's own gloss without touching the filesystem.
 */
export function glossResolver(
  locale: string, deck: 'greek' | 'hebrew' = 'greek',
): (word: string, english: string) => string {
  const cat = catalogue(locale, deck)
  if (cat === NO_CONTENT) return (_w, english) => english
  // Same NFC normalisation as the build and the client — see vocabItems() in i18n-content.
  return (word, english) => content(cat, `vocab.gloss.${deck}.${word.normalize('NFC')}`, english)
}
