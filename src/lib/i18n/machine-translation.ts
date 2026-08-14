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

/**
 * Fence the Greek and Hebrew inside a block of third-party HTML so the block as a whole can be
 * opted in.
 *
 * The rule above — mark the English COLUMN, never a row holding both — assumes the two languages
 * arrive in separate elements we control. The commentaries do not work that way: Robertson's
 * Word Pictures is one stream of HTML with the Greek word he is discussing set inline in it
 * ("A Righteous Man (δικαιος). Or just, not benignant…"), and 7,176 of his 7,208 entries have
 * Greek in them. Marking that stream translatable without this would hand the browser the very
 * words the entry exists to explain, and it would duly render δικαιος as "dikaios" or worse.
 *
 * So the fence is put up inside the HTML instead: every run of Greek or Hebrew script becomes a
 * translate="no" span, and the English around it stays translatable. Runs are matched only in
 * text, never inside a tag, so the markup is not disturbed.
 *
 * THE SCRIPT IS NOT ALWAYS SCRIPT. Keil & Delitzsch stores its Hebrew as numeric character
 * references — "&#1497;&#1504;&#1468;…" — so the file contains no Hebrew character at all and
 * every search for one says the corpus is clean. It becomes Hebrew only when the browser decodes
 * it, which is precisely when a translator would get hold of it. A run is therefore matched as
 * script characters OR entities, and what the entities decode to decides whether it is fenced.
 */
const GREEK = '\\u0370-\\u03FF\\u1F00-\\u1FFF'
const HEBREW = '\\u0590-\\u05FF\\uFB1D-\\uFB4F'
const SCRIPT = new RegExp(`[${GREEK}${HEBREW}]`)
const HEBREW_ONLY = new RegExp(`[${HEBREW}]`)
const ENTITY = '&#\\d{2,6};|&#[xX][0-9a-fA-F]{2,5};'
/** One unit of possible original script: a character of it, or an entity that may decode to one. */
const UNIT = `(?:[${GREEK}${HEBREW}]|${ENTITY})`
/** Whatever may sit BETWEEN units without ending the run — spaces, its own punctuation, maqqef. */
const JOIN = `[\\s\\u0387\\u00B7\\u2019'\\-,.\\u05BE]`
const RUN = new RegExp(`${UNIT}(?:(?:${UNIT}|${JOIN})*${UNIT})?`, 'g')
const TAG_OR_TEXT = /<[^>]*>|[^<]+/g

function decodeNumericEntities(s: string): string {
  return s.replace(/&#(\d{2,6});|&#[xX]([0-9a-fA-F]{2,5});/g, (_m, dec: string, hex: string) => {
    const code = dec ? parseInt(dec, 10) : parseInt(hex, 16)
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : _m
  })
}

export function fenceOriginalScripts(html: string): string {
  if (!SCRIPT.test(html) && !/&#/.test(html)) return html
  return html.replace(TAG_OR_TEXT, seg => seg.startsWith('<') ? seg : seg.replace(RUN, run => {
    // An entity run that turns out to be an em-dash or a curly quote is left exactly as it was:
    // only what actually decodes to Greek or Hebrew earns a fence.
    const decoded = decodeNumericEntities(run)
    if (!SCRIPT.test(decoded)) return run
    return `<span translate="no" lang="${HEBREW_ONLY.test(decoded) ? 'he' : 'grc'}">${run}</span>`
  }))
}

/**
 * The same fence for prose that is NOT html.
 *
 * Bengel's Gnomon is stored as plain text and rendered as plain text — 172,590 Greek characters
 * across 2,836 entries — so it cannot take the span treatment above without being turned into
 * markup first, which would mean escaping third-party text to un-escape it again. Instead it is
 * handed back as segments and the component wraps them: same fence, built out of React rather
 * than out of a string.
 */
export function segmentOriginalScripts(text: string): { text: string; lang: 'grc' | 'he' | null }[] {
  if (!SCRIPT.test(text)) return [{ text, lang: null }]
  const out: { text: string; lang: 'grc' | 'he' | null }[] = []
  let last = 0
  const re = new RegExp(RUN.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (!SCRIPT.test(m[0])) continue
    if (m.index > last) out.push({ text: text.slice(last, m.index), lang: null })
    out.push({ text: m[0], lang: HEBREW_ONLY.test(m[0]) ? 'he' : 'grc' })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), lang: null })
  return out
}
