/**
 * Opting a block into the browser's own page translation.
 *
 * The app sets `translate="no"` on <body> (see app/layout.tsx), so Chrome/Safari/Edge leave the
 * page alone by default — the Greek, the Hebrew, the already-translated interface, names and
 * assignment titles all stay as written. These helpers mark the exceptions: English source texts
 * we have not translated and realistically never will, where a machine translation is the only
 * way a Spanish reader gets in at all.
 *
 * WHAT QUALIFIES. Only prose that is (a) English, (b) part of the corpus rather than the app,
 * and (c) not something a student would quote as evidence without checking. Philo in Yonge's
 * Victorian English qualifies. A Bible translation does NOT: the reader can simply pick the
 * Spanish one, and a machine translation of the English WEB would be strictly worse than the
 * Reina-Valera sitting one menu away.
 *
 * WHAT IT IS NOT. This is not a translation feature we control, and nothing here is stored,
 * cited or graded. It is the reader's own browser, acting on text we have marked as safe for it
 * to act on. The corollary is that a marked block must not contain Greek — mark the English
 * COLUMN, never a row that holds both — because opting a container in opts its children in too.
 */

/** Spread onto an English prose block to allow browser translation of it. */
export const translatable = { translate: 'yes', lang: 'en' } as const

/**
 * Spread onto anything inside a translatable block that must stay as written — a Greek quotation
 * inside an English paragraph, a reference, a siglum.
 */
export const notTranslatable = { translate: 'no' } as const

/** Greek text: never machine-translated, and tagged so fonts and screen readers agree. */
export const greekText = { translate: 'no', lang: 'grc' } as const

/** Hebrew text: as above, right-to-left. */
export const hebrewText = { translate: 'no', lang: 'he', dir: 'rtl' } as const
