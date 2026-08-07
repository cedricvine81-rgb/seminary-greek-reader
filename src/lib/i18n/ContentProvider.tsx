'use client'
import { createContext, useContext, useMemo } from 'react'
import { content, NO_CONTENT, type ContentCatalogue } from './content'

/**
 * Supplies a surface's translated content to a client tree.
 *
 * Themes passes its catalogue straight down as a prop, which is the better shape when one
 * component owns the whole surface. This exists for the other case: RhetoricView is four levels
 * inside ExegesisTabs, and threading a catalogue through every intermediate component would put
 * an i18n prop on components that have nothing to do with i18n.
 *
 * It is still SCOPED — a page provides only the catalogue for the surface it renders, loaded on
 * the server by loadContent(). It is deliberately not mounted in the root layout: that would put
 * every language's every surface into the payload of every page, which is exactly the cost this
 * design exists to avoid. An English reader is given NO_CONTENT and the lookups below reduce to
 * returning the English they were passed.
 */
const Ctx = createContext<ContentCatalogue>(NO_CONTENT)

export function ContentProvider(
  { catalogue, children }: { catalogue: ContentCatalogue; children: React.ReactNode },
) {
  return <Ctx.Provider value={catalogue}>{children}</Ctx.Provider>
}

/**
 * `tc(key, english)` for the surrounding surface — the English is always the fallback, so a
 * component under no provider, or under a partial translation, renders English rather than
 * breaking.
 */
export function useTc(): (key: string, english: string) => string {
  const cat = useContext(Ctx)
  return useMemo(() => (key: string, english: string) => content(cat, key, english), [cat])
}
