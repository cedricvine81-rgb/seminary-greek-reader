'use client'
import { useState } from 'react'
import { PencilLine, ListTree } from 'lucide-react'
import { ExegesisWorkspace } from './ExegesisWorkspace'
import { PhraseExplorer } from '@/components/phrase/PhraseExplorer'

/**
 * Standalone Exegesis page: a tab toggle between the annotation Workspace and the
 * Phrasing (syntax tree) view. Both stay mounted so switching tabs keeps each one's
 * state. Phrasing lives only on this public study page — translation assignments and
 * exams render <ExegesisWorkspace> directly (no phrasing, so it can't leak answers).
 */
export function ExegesisTabs({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [tab, setTab] = useState<'workspace' | 'phrasing'>('workspace')

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-brand-100 text-brand-800' : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <>
      <div className="flex-none flex items-center gap-1 mb-2">
        <button type="button" onClick={() => setTab('workspace')} className={tabClass(tab === 'workspace')}>
          <PencilLine size={16} /> Exegesis
        </button>
        <button type="button" onClick={() => setTab('phrasing')} className={tabClass(tab === 'phrasing')}>
          <ListTree size={16} /> Phrasing
        </button>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col ${tab === 'workspace' ? '' : 'hidden'}`}>
        <ExegesisWorkspace isAuthenticated={isAuthenticated} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'phrasing' ? '' : 'hidden'}`}>
        <PhraseExplorer />
      </div>
    </>
  )
}
