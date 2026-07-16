'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { registerMasterSearch, type MasterSearchPreset } from '@/lib/master-search-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { snapshotScroll } from '@/lib/scroll-restore'

// Mounted once in the root layout. Routes the header icon / mobile menu / right-click word menu
// (all via openMasterSearch()) and ⌘K / Ctrl-K to the full-page /search. An optional preset
// pre-fills the query + scope via URL params. Disabled during a lockdown exam.
export function MasterSearchProvider() {
  const router = useRouter()
  const doOpen = useCallback((p?: MasterSearchPreset) => {
    if (isExamLocked()) return
    const params = new URLSearchParams()
    if (p?.query) params.set('q', p.query)
    if (p?.scope) params.set('in', p.scope)
    if (p?.lemma) params.set('mode', 'lemma')   // search all inflected forms of the lemma
    if (p?.books) params.set('books', p.books)   // restrict to these osisId book(s)
    if (p?.features) params.set('features', p.features)   // morphology-search criteria (scope morph:*)
    // Remember the page the search was launched from (Reader, Texts, …) so /search can offer a
    // "Return to page" that goes back to exactly where they were (router.back → restored scroll).
    const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    if (here && !here.startsWith('/search')) {
      params.set('from', here)
      snapshotScroll(here)   // remember where we were so "Return to page" can restore it
    }
    const qs = params.toString()
    router.push(qs ? `/search?${qs}` : '/search')
  }, [router])

  useEffect(() => {
    registerMasterSearch(doOpen)
    return () => registerMasterSearch(null)
  }, [doOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        doOpen()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [doOpen])

  return null
}
