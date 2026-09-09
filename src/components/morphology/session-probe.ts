'use client'
/* ─────────────────────────────────────────────
   One shared answer to "is anyone signed in, and what have they completed?"

   The Grammar pages are PUBLIC, but the parsing drills are not: the form pools are
   server-only and /api/self-study/morph is login-gated. So the "Practise these forms" call to
   action has to know whether there is a session — offering a visitor a link that can only end
   at a sign-in wall is worse than not offering it.

   /api/morphology/progress answers both questions at once (200 with the chapter list when
   signed in, 401 when not), and useCourseProgress was already calling it. This module makes
   that ONE request per page load, shared: the probe is cached and in-flight callers join it,
   so adding the call-to-action costs no extra traffic.
───────────────────────────────────────────── */
import { useEffect, useState } from 'react'

export interface ProgressProbe {
  signedIn: boolean
  chapters: string[]
}

let cached: Promise<ProgressProbe> | null = null

/** The (deduped, page-lifetime-cached) progress fetch. */
export function probeProgress(): Promise<ProgressProbe> {
  if (!cached) {
    cached = fetch('/api/morphology/progress')
      .then(async r => (r.ok
        ? { signedIn: true, chapters: ((await r.json()) as { chapters?: string[] }).chapters ?? [] }
        : { signedIn: false, chapters: [] }))
      // A network failure is not an answer, but it must still resolve or every caller hangs;
      // treating it as signed-out only hides a call to action, which is the safe way to be wrong.
      .catch(() => ({ signedIn: false, chapters: [] }))
  }
  return cached
}

/**
 * Record a completion change against the cached answer.
 *
 * The cache is what makes the probe one request per page — but a cached chapter LIST goes
 * stale the moment the student ticks something, and useCourseProgress merges the server list
 * with the local one (union). So a stale cache resurrects an un-ticked chapter on the next
 * mount, and the merge then pushes it back to the server on the following page load: the
 * un-tick silently undoes itself. Keeping the cached list in step is enough, and it costs no
 * request — the write has already gone up.
 */
export function noteChapterChange(chapterId: string, done: boolean): void {
  if (!cached) return
  cached = cached.then(p => {
    if (!p.signedIn) return p
    const chapters = p.chapters.filter(c => c !== chapterId)
    if (done) chapters.push(chapterId)
    return { ...p, chapters }
  })
}

/** null while unknown — render neither state until the answer arrives, or a signed-in student
 *  sees the call to action flicker in. */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    probeProgress().then(p => { if (alive) setSignedIn(p.signedIn) })
    return () => { alive = false }
  }, [])
  return signedIn
}
