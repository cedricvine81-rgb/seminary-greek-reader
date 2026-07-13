'use client'

import { useCallback, useEffect, useState } from 'react'
import { registerMasterSearch, type MasterSearchPreset } from '@/lib/master-search-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { MasterSearchModal } from './MasterSearchModal'

// Mounted once in the root layout. Hosts the Master Search pane, lets the header icon / mobile
// menu / right-click word menu open it via openMasterSearch(), and binds ⌘K / Ctrl-K. Disabled
// during a lockdown exam.
export function MasterSearchProvider() {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<MasterSearchPreset | null>(null)
  const doOpen = useCallback((p?: MasterSearchPreset) => { if (!isExamLocked()) { setPreset(p ?? null); setOpen(true) } }, [])

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

  return <MasterSearchModal open={open} preset={preset} onClose={() => setOpen(false)} />
}
