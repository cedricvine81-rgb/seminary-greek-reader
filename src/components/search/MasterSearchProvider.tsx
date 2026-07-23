'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerMasterSearch, type MasterSearchPreset } from '@/lib/master-search-bus'
import { MasterSearchPanel } from './MasterSearchPanel'
import { isExamLocked } from '@/lib/exam-lockdown'
import { snapshotScroll } from '@/lib/scroll-restore'

// Mounted once in the root layout. Routes the header icon / mobile menu / right-click word menu
// (all via openMasterSearch()) and ⌘K / Ctrl-K to the Master Search. Disabled during a lockdown
// exam.
//
// The search opens as a SIDE PANEL over the current page (MasterSearchPanel) — the page stays
// mounted and visible, so results can be compared with the passage without any "return" round
// trip. This includes morphology searches (scope morph:*): the panel hosts MorphSearchPage, so
// the Grammar pages' "See it in the NT" links open beside the page. One case still navigates:
// already ON /search — the full page owns the search UI there, so just update its URL.
export function MasterSearchProvider({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const router = useRouter()
  // nonce keys the panel so re-opening with a new preset (e.g. right-clicking another word
  // while the panel is up) remounts SearchPageView with the new initial query/scope.
  const [panel, setPanel] = useState<{ preset?: MasterSearchPreset; nonce: number } | null>(null)

  const doOpen = useCallback((p?: MasterSearchPreset) => {
    if (isExamLocked()) return
    const onSearchPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/search')
    if (onSearchPage) {
      const params = new URLSearchParams()
      if (p?.query) params.set('q', p.query)
      if (p?.scope) params.set('in', p.scope)
      if (p?.lemma) params.set('mode', 'lemma')   // search all inflected forms of the lemma
      if (p?.books) params.set('books', p.books)   // restrict to these osisId book(s)
      if (p?.features) params.set('features', p.features)   // morphology-search criteria (scope morph:*)
      if (p?.strongs) params.set('strongs', p.strongs)   // Hebrew "all forms": search by Strong's number
      // This branch NAVIGATES away, so keep the origin + scroll snapshot for its "Return to
      // page" (the panel path needs neither — the origin page never unmounts).
      const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
      if (here && !here.startsWith('/search')) {
        params.set('from', here)
        snapshotScroll(here)
      }
      const qs = params.toString()
      router.push(qs ? `/search?${qs}` : '/search')
      return
    }
    setPanel(prev => ({ preset: p, nonce: (prev?.nonce ?? 0) + 1 }))
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

  if (!panel) return null
  return <MasterSearchPanel key={panel.nonce} preset={panel.preset} isAuthenticated={isAuthenticated} onClose={() => setPanel(null)} />
}
