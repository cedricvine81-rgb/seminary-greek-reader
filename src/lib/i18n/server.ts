import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './locale'
import { translator } from './translate'

/**
 * The interface locale for a server render, from the cookie. Same source the layout uses to
 * set <html lang>, so server and client always agree on the first paint.
 */
export async function getServerLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(v) ? v : DEFAULT_LOCALE
}

/** A bound `t` for server components and route handlers. */
export async function getServerT() {
  return translator(await getServerLocale())
}
