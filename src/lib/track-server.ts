import { cookies } from 'next/headers'
import { DEFAULT_TRACK, TRACK_COOKIE, isTrack, brandFor, type Track, type Brand } from './track'

/**
 * The language track for a server render, from the cookie — the same source the layout uses
 * to pick the brand, so server and client always agree on the first paint. Mirrors
 * getServerLocale() in i18n/server.ts.
 */
export async function getServerTrack(): Promise<Track> {
  const v = (await cookies()).get(TRACK_COOKIE)?.value
  return isTrack(v) ? v : DEFAULT_TRACK
}

/** The brand (name, monogram, description) for this server render. */
export async function getServerBrand(): Promise<Brand> {
  return brandFor(await getServerTrack())
}
