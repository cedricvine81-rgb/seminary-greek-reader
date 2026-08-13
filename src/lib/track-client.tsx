'use client'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { DEFAULT_TRACK, TRACK_COOKIE, isTrack, brandFor, type Track, type Brand } from './track'

/**
 * Client-side access to the language track. The value is handed down from the server layout
 * (which read the cookie) rather than read from `document.cookie` on mount, so the first
 * client render already agrees with the server's — no flash of the wrong brand.
 *
 * Setting it writes the cookie and refreshes, because most of what the track changes is
 * rendered on the server (the header brand, page metadata, tool defaults).
 */
const TrackContext = createContext<Track>(DEFAULT_TRACK)

export function TrackProvider({ track, children }: { track: Track; children: ReactNode }) {
  return <TrackContext.Provider value={track}>{children}</TrackContext.Provider>
}

export function useTrackValue(): Track {
  return useContext(TrackContext)
}

export function useBrand(): Brand {
  return brandFor(useContext(TrackContext))
}

/** Read/write the track. Writing reloads so server-rendered branding follows. */
export function useTrack(): [Track, (t: Track) => void] {
  const fromServer = useContext(TrackContext)
  const [track, setTrackState] = useState<Track>(fromServer)

  const set = useCallback((t: Track) => {
    if (!isTrack(t)) return
    setTrackState(t)
    document.cookie = `${TRACK_COOKIE}=${t}; path=/; max-age=31536000; samesite=lax`

    // Reload rather than router.refresh(): the brand is in <title> and in the header the
    // root layout renders, and a soft refresh does not reliably re-run generateMetadata.
    //
    // Drop the Reader's position pins on the way. It writes ?ref=&corpus= into the URL as
    // you read so a passage stays shareable, and an explicit ?corpus= deliberately beats
    // the track default — which would otherwise mean switching to Hebrew and still facing
    // Matthew. Removing them lets the new track's default apply. They are the only two
    // parameters touched, so every other page's query string survives untouched.
    const url = new URL(window.location.href)
    url.searchParams.delete('corpus')
    url.searchParams.delete('ref')
    window.location.replace(url.toString())
  }, [])

  return [track, set]
}
