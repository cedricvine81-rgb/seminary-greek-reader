import { CATALOGUES, type Message } from './messages'
import { DEFAULT_LOCALE, type Locale } from './locale'

export type Vars = Record<string, string | number>

// Intl.PluralRules is built into Node and every browser we support, so plural selection needs
// no library. It matters most for Russian, which has three plural forms (1 участник,
// 2 участника, 5 участников) where English has two.
const _rules = new Map<Locale, Intl.PluralRules>()
function rules(locale: Locale): Intl.PluralRules {
  let r = _rules.get(locale)
  if (!r) { r = new Intl.PluralRules(locale); _rules.set(locale, r) }
  return r
}

function pick(msg: Message, locale: Locale, vars?: Vars): string {
  if (typeof msg === 'string') return msg
  const count = vars?.count
  if (typeof count === 'number') {
    const cat = rules(locale).select(count)
    // Fall through the categories the catalogue actually provides. `other` is required by
    // Intl for every locale, so it is the safe last resort.
    return msg[cat] ?? msg.other ?? Object.values(msg)[0] ?? ''
  }
  return msg.other ?? Object.values(msg)[0] ?? ''
}

/**
 * Look up `key` in `locale`, interpolate `{name}` placeholders, and resolve plurals.
 *
 * An unknown key falls back to English and then to the key itself, so a partly translated
 * locale degrades into English rather than into visible key names — a half-finished
 * translation should look unfinished, not broken.
 */
export function translate(locale: Locale, key: string, vars?: Vars): string {
  const msg = CATALOGUES[locale]?.[key] ?? CATALOGUES[DEFAULT_LOCALE][key]
  if (msg === undefined) {
    // Loud in development, silent in production: a missing key is a bug to fix, but not a
    // reason to show a student a stack trace.
    if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] missing key: ${key}`)
    return key
  }
  const raw = pick(msg, locale, vars)
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (_m, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`)
}

/** A bound translator, so components can call t('nav.reader') without passing the locale. */
export function translator(locale: Locale) {
  return (key: string, vars?: Vars) => translate(locale, key, vars)
}
