import { authorOf, workTitleWithoutAuthor, type CatalogWork } from '@/lib/texts-catalog'
import { textAuthorLabel, textWorkTitle } from './text-names'

/**
 * The join between the /texts catalogue and its Spanish names.
 *
 * It is a module of its own so that neither side has to know about the other: texts-catalog.ts
 * stays free of i18n (it is imported by API routes and by the search index builder, which have
 * no locale), and text-names.ts stays a plain data file with no dependency on the catalogue's
 * types. Every Texts surface calls THESE two functions rather than reading `.name`/`.label`
 * directly, so the menus, the in-page picker and the search collection list cannot drift apart.
 *
 * Neither function may be used to build a citation. See the rule in text-names.ts.
 */

/** Title as listed under an author heading — localized, else the English title. */
export function localizedWorkTitle(w: CatalogWork, locale: string): string {
  return textWorkTitle(w.id, locale, workTitleWithoutAuthor(w), w.osisId)
}

/**
 * The work's full display name, for headings that stand alone: "Platón, República".
 *
 * A rabbinic work keeps its English name whole, because its name IS a citation siglum
 * ("b. Berakhot") that Spanish scholarship uses unchanged — localizing it would invent a form
 * no one cites.
 */
export function localizedWorkName(w: CatalogWork, locale: string): string {
  if (w.group) return w.name
  const title = localizedWorkTitle(w, locale)
  const author = authorOf(w)
  return author ? `${textAuthorLabel(author, locale)}, ${title}` : title
}
