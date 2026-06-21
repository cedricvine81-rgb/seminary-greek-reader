'use client'
import { useState } from 'react'
import { PencilLine, ListTree, Columns3 } from 'lucide-react'
import { ExegesisWorkspace } from './ExegesisWorkspace'
import { PhraseExplorer } from '@/components/phrase/PhraseExplorer'
import { SynopsisView } from '@/components/phrase/SynopsisView'

/**
 * Standalone Exegesis page: one shared Passage box drives three tabs — the annotation
 * Workspace, the Phrasing (syntax) tree, and the Synopsis (parallel comparison). All
 * tabs stay mounted so switching keeps their state. Phrasing/Synopsis live only on this
 * public study page — translation assignments and exams render <ExegesisWorkspace>
 * directly (no phrasing, so it can't leak answers).
 */
export function ExegesisTabs({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [tab, setTab] = useState<'workspace' | 'phrasing' | 'synopsis'>('workspace')
  // The single passage that coordinates every tab. `input` is the live box text;
  // `passage` is committed on Enter/blur and pushed to the tabs.
  const [input, setInput] = useState('John 1:1-5')
  const [passage, setPassage] = useState('John 1:1-5')

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-brand-100 text-brand-800' : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <>
      {/* Shared passage box + tabs */}
      <div className="flex-none flex items-center flex-wrap gap-3 mb-2">
        <div className="flex items-center">
          <span className="px-3 py-1.5 rounded-l-lg bg-brand-600 text-white text-sm font-medium">Passage</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
            onBlur={() => setPassage(input.trim())}
            placeholder="e.g. Matthew 3:1-3"
            className="border border-gray-300 rounded-l-none rounded-r-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setTab('workspace')} className={tabClass(tab === 'workspace')}><PencilLine size={16} /> Exegesis</button>
          <button type="button" onClick={() => setTab('phrasing')} className={tabClass(tab === 'phrasing')}><ListTree size={16} /> Phrasing</button>
          <button type="button" onClick={() => setTab('synopsis')} className={tabClass(tab === 'synopsis')}><Columns3 size={16} /> Synopsis</button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col ${tab === 'workspace' ? '' : 'hidden'}`}>
        <ExegesisWorkspace isAuthenticated={isAuthenticated} controlledPassage={passage} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'phrasing' ? '' : 'hidden'}`}>
        <PhraseExplorer controlledPassage={passage} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'synopsis' ? '' : 'hidden'}`}>
        <SynopsisView controlledPassage={passage} />
      </div>
    </>
  )
}
