'use client'
import { useEffect, useState } from 'react'

/**
 * False on the server and on the first client render; true from the first effect onwards.
 *
 * The guard for anything whose value the SERVER cannot know: the viewer's timezone, their
 * clock, their locale settings. Reading those during render makes the HTML the server sent
 * disagree with what the browser draws, React throws the whole boundary away and re-renders it
 * in the client ("Text content does not match server-rendered HTML" — React #425, and the #419
 * and #422 that follow it). Rendering something stable until this flips costs one extra paint
 * and keeps the server's HTML usable.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}
