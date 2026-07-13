'use client'

import { useCallback, useEffect, useState } from 'react'
import { registerMasterSearch } from '@/lib/master-search-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { MasterSearchModal } from './MasterSearchModal'

// Mounted once in the root layout. Hosts the Master Search pane, lets the header icon / mobile
// menu open it via openMasterSearch(), and binds the ⌘K / Ctrl-K shortcut. Disabled during a
// lockdown exam.
export function MasterSearchProvider() {
  const [open, setOpen] = useState(false)
  const doOpen = useCallback(() => { if (!isExamLocked()) setOpen(true) }, [])

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

  return <MasterSearchModal open={open} onClose={() => setOpen(false)} />
}
