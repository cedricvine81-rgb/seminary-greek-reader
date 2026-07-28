'use client'

import { useCallback, useEffect, useState } from 'react'
import { registerProsePanel, type ProsePassageTarget } from '@/lib/prose-panel-bus'
import { ProsePassagePanel } from './ProsePassagePanel'
import { isExamLocked } from '@/lib/exam-lockdown'

// Mounted once in the root layout, like MasterSearchProvider: hosts the prose side panel so
// any page can open a cited source beside itself via openProsePassage(). Disabled during a
// lockdown exam, where outside texts are not available.
export function ProsePanelProvider() {
  // nonce keys the panel so opening a second citation while one is up remounts it on the
  // new target (fresh fetch + scroll) instead of showing stale content.
  const [panel, setPanel] = useState<{ target: ProsePassageTarget; nonce: number } | null>(null)

  const doOpen = useCallback((t: ProsePassageTarget) => {
    if (isExamLocked()) return
    setPanel(prev => ({ target: t, nonce: (prev?.nonce ?? 0) + 1 }))
  }, [])

  useEffect(() => {
    registerProsePanel(doOpen)
    return () => registerProsePanel(null)
  }, [doOpen])

  if (!panel) return null
  return <ProsePassagePanel key={panel.nonce} target={panel.target} onClose={() => setPanel(null)} />
}
