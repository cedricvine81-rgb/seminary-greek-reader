'use client'
import { useEffect, useState } from 'react'
import { content, fingerprint, NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'

/**
 * The pericope headings ("The Parable of the Sower") in the reader's language.
 *
 * The headings live in public/data/pericopes.json, which is fetched by three different passage
 * boxes; the translations live beside it in pericope-titles/<locale>.json, keyed by a
 * fingerprint OF THE ENGLISH TITLE. That keying is the staleness check: retitle a section and
 * its key changes, so the old translation simply stops matching and the reader gets the new
 * English rather than a rendering of a heading that no longer exists.
 *
 * An English reader fetches nothing — the resolver is the identity function, decided before
 * any request is made. The catalogue is fetched once per session and shared by every box.
 */
export type TitleResolver = (title: string) => string

const cache = new Map<string, Promise<TitleResolver>>()

function build(locale: string): Promise<TitleResolver> {
  return fetch(`/data/pericope-titles/${locale}.json`)
    .then(r => (r.ok ? r.json() : NO_CONTENT))
    .catch(() => NO_CONTENT)
    .then((cat: ContentCatalogue) =>
      (title: string) => content(cat, `peri.${fingerprint(title)}`, title))
}

export function pericopeTitleResolver(locale: string): Promise<TitleResolver> {
  if (locale === 'en') return Promise.resolve((t: string) => t)
  let p = cache.get(locale)
  if (!p) { p = build(locale); cache.set(locale, p) }
  return p
}

/** The resolver as a hook: identity until the catalogue arrives, so nothing flashes empty. */
export function usePericopeTitles(locale: string): TitleResolver {
  const [resolve, setResolve] = useState<TitleResolver>(() => (t: string) => t)
  useEffect(() => {
    let live = true
    // Through an updater — handing setState the resolver itself would call it as an updater.
    pericopeTitleResolver(locale).then(r => { if (live) setResolve(() => r) })
    return () => { live = false }
  }, [locale])
  return resolve
}
