'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { registerGrammarPanel, type GrammarPanelTarget } from '@/lib/grammar-panel-bus'
import { GrammarPanel } from './GrammarPanel'
import { isExamLocked } from '@/lib/exam-lockdown'

/**
 * Mounted once in the root layout, like MasterSearchProvider. Hosts the Grammar side panel
 * opened from the Reader's syntax menu.
 *
 * Not registered while ON /grammar — the page already is the Grammar, so a panel over it
 * would be absurd; the syntax menu falls back to an ordinary link there (hasGrammarPanel()).
 * Closed on navigation so it can't outlive the page it was opened beside, and disabled during
 * a lockdown exam like the other panels.
 */
export function GrammarPanelProvider() {
  const pathname = usePathname()
  const [target, setTarget] = useState<GrammarPanelTarget | null>(null)
  const onGrammarPage = (pathname ?? '').startsWith('/grammar')

  const doOpen = useCallback((t: GrammarPanelTarget) => {
    if (isExamLocked()) return
    setTarget(t)
  }, [])

  useEffect(() => {
    if (onGrammarPage) return
    registerGrammarPanel(doOpen)
    return () => registerGrammarPanel(null)
  }, [doOpen, onGrammarPage])

  useEffect(() => { setTarget(null) }, [pathname])

  if (!target) return null
  return <GrammarPanel target={target} onClose={() => setTarget(null)} />
}
