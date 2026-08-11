import { ALL_MORPH_FEATURES, MORPH_GROUP_BY_KEY } from '@/lib/morph-features'
import { HEBREW_ALL_FEATURES } from '@/lib/morph-features-hebrew'

/**
 * Localized parsing terminology — the one place any surface turns a parsing token into words.
 *
 * This vocabulary was deliberately held back while everything around it was translated, because
 * it is shared: the reader's morphology picker, the parsing pane, MorphSearchPage, construct
 * search and the Variants tab all show the same terms, and translating it inside any one of them
 * would have left a student reading "genitive" in the pane and "genitivo" in the search box.
 * Moving it means moving all of them, which is what this module is for.
 *
 * Keys are `morph.feat.<token with spaces as dashes>` and `morph.group.<category key>`, so a
 * token that comes straight out of the corpus data maps to a key without a lookup table in
 * between. An unknown token falls through to itself rather than showing a key — corpora carry
 * tags the feature tables do not list, and a raw tag is more useful than "morph.feat.foo".
 */
type T = (key: string, vars?: Record<string, string | number>) => string

const slug = (value: string) => value.replace(/\s+/g, '-')

/** One parsing token → its name in the reader's language ("genitive" → "genitivo"). */
export function featureLabel(value: string, t: T): string {
  const key = `morph.feat.${slug(value.trim().toLowerCase())}`
  const out = t(key)
  return out === key ? value : out
}

/** A category name ("case" → "Caso"). Falls back to the table's English label. */
export function groupLabel(key: string, t: T, english?: string): string {
  const k = `morph.group.${key}`
  const out = t(k)
  return out === k ? (english ?? key) : out
}

/**
 * A whole parsing string, as stored in the corpus data and shown by the parsing pane:
 * "verb, present, active, indicative, 3 person, singular".
 *
 * Split and translated token by token rather than held as one key per parsing, because the
 * combinations are open-ended — there is no list of every parsing a Greek verb can have, only a
 * list of the features it is built from. The separator is kept as the source wrote it.
 */
export function translateParsing(parsing: string | undefined | null, t: T): string {
  if (!parsing) return parsing ?? ''
  return parsing
    .split(',')
    .map(part => {
      const token = part.trim()
      if (!token) return part
      const label = featureLabel(token, t)
      // Preserve the original spacing around the token so the line reads as it did.
      return part.replace(token, label)
    })
    .join(',')
}

/** True when a token is one this vocabulary knows — used to decide whether to try translating. */
export function isKnownFeature(value: string): boolean {
  const v = value.trim().toLowerCase()
  return ALL_MORPH_FEATURES.has(v) || HEBREW_ALL_FEATURES.has(v)
}

export { MORPH_GROUP_BY_KEY }
