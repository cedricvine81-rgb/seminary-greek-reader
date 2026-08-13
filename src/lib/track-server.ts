import { cookies } from 'next/headers'
import { DEFAULT_TRACK, TRACK_COOKIE, isTrack, brandFor, type Track, type Brand } from './track'

/**
 * The language track for a server render, from the cookie — the same source the layout uses
 * to pick the brand, so server and client always agree on the first paint. Mirrors
 * getServerLocale() in i18n/server.ts.
 */
export function getServerTrack(): Track {
  const v = cookies().get(TRACK_COOKIE)?.value
  return isTrack(v) ? v : DEFAULT_TRACK
}

/** The brand (name, monogram, description) for this server render. */
export function getServerBrand(): Brand {
  return brandFor(getServerTrack())
}
