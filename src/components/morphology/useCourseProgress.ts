'use client'

/* ─────────────────────────────────────────────
   Morphology course-mode progress hook

   Completion state lives in two places:
     • localStorage  — always written, so logged-out users (and any API
       hiccup) still get durable per-device progress.
     • the server    — /api/morphology/progress, when the user is signed in,
       so progress follows the account across devices.

   On mount we show localStorage immediately, then merge the server list in
   (union) and push any local-only ids up — a one-time reconcile that makes
   "marked some chapters before logging in" just work.
───────────────────────────────────────────── */

import { useState, useEffect, useCallback } from 'react'

const LS_KEY = 'morph-progress'

function readLocal(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeLocal(ids: Set<string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids))) } catch { /* ignore */ }
}

function postChapter(chapterId: string, completed: boolean) {
  void fetch('/api/morphology/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, completed }),
  }).catch(() => { /* logged out or offline — localStorage already has it */ })
}

// Cross-instance sync: several components on one page may each call this hook (e.g. the
// self-study track list behind an embedded quiz panel). A tick in one instance is
// broadcast so every other instance updates without a reload.
const SYNC_EVENT = 'morph-progress-changed'

export function useCourseProgress() {
  // Start empty (matches the server-rendered HTML), hydrate in the effect.
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    const local = readLocal()
    if (local.length) setCompleted(new Set(local))

    fetch('/api/morphology/progress')
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data: { chapters?: string[] } | null) => {
        if (cancelled || !data) return
        const server = data.chapters ?? []
        const merged = new Set([...server, ...local])
        setCompleted(merged)
        writeLocal(merged)
        for (const id of local) if (!server.includes(id)) postChapter(id, true)
      })

    const onSync = (e: Event) => {
      const { chapterId, done } = (e as CustomEvent<{ chapterId: string; done: boolean }>).detail ?? {}
      if (typeof chapterId !== 'string') return
      setCompleted(prev => {
        const next = new Set(prev)
        if (done) next.add(chapterId)
        else next.delete(chapterId)
        return next
      })
    }
    window.addEventListener(SYNC_EVENT, onSync)
    return () => { cancelled = true; window.removeEventListener(SYNC_EVENT, onSync) }
  }, [])

  const setChapter = useCallback((chapterId: string, done: boolean) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (done) next.add(chapterId)
      else next.delete(chapterId)
      writeLocal(next)
      return next
    })
    postChapter(chapterId, done)
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { chapterId, done } }))
  }, [])

  return { completed, setChapter }
}
