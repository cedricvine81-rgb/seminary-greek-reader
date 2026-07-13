'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { registerWordSearch, type WordSearchPayload } from '@/lib/word-search-bus'
import { openMasterSearch } from '@/lib/master-search-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { HighlightSwatches } from '@/components/highlights/HighlightSwatches'

// Mounted once in the root layout. Renders the shared "search this word" popover — the search
// half of the Reader's right-click menu (no syntax) — and opens it via openWordSearch(). Every
// action routes into the Master Search pane, pre-filled + run. Disabled during a lockdown exam.

const TRANS_LABEL: Record<string, string> = {
  en: 'English', bsb: 'English', es: 'Spanish', fr: 'French',
  pt: 'Portuguese', ru: 'Russian', ko: 'Korean', zh: 'Mandarin',
}

export function WordSearchProvider() {
  const [menu, setMenu] = useState<WordSearchPayload | null>(null)
  const [scope, setScope] = useState<'GNT' | 'LXX'>('GNT')
  const [copied, setCopied] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    registerWordSearch(p => {
      if (isExamLocked()) return
      setScope(p.greekCorpus ?? 'GNT')
      setCopied(null)
      setMenu(p)
    })
    return () => registerWordSearch(null)
  }, [])

  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setMenu(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    const onScroll = () => setMenu(null)
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', onScroll, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  if (!menu) return null

  const run = (scopeVal: string, query: string) => { setMenu(null); openMasterSearch({ query, scope: scopeVal }) }
  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1200) }).catch(() => {})
  }
  const w = menu.surface
  const isGreek = menu.kind === 'greek'
  const transLabel = TRANS_LABEL[menu.transLang ?? 'en'] ?? 'this translation'
  const btn = 'w-full text-left px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors'

  return (
    <div
      ref={ref}
      className="fixed z-[110] w-64 rounded-xl border border-gray-200 bg-white shadow-2xl p-2.5 space-y-2"
      style={{ left: Math.min(menu.x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 272), top: menu.y }}
    >
      {/* Highlighter swatches — Greek words in highlight-capable panes. Highlights the word. */}
      {menu.highlight && (
        <div className="pb-1.5 border-b border-gray-100">
          <HighlightSwatches
            activeColor={menu.highlight.activeColor}
            onPick={c => { menu.highlight!.onPick(c); setMenu(null) }}
            onRemove={() => { menu.highlight!.onRemove(); setMenu(null) }}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Search this word</span>
        {isGreek && (
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-[10px] leading-none">
            {(['GNT', 'LXX'] as const).map(s => (
              <button key={s} type="button" onClick={() => setScope(s)}
                className={`px-1.5 py-1 transition-colors ${scope === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                {s === 'GNT' ? 'NT' : 'OT'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="truncate text-sm font-semibold text-brand-800" style={{ fontFamily: isGreek ? "'Gentium Plus', Georgia, serif" : undefined }}>{w}</div>

      <div className="space-y-1.5">
        {isGreek ? (
          <button type="button" className={btn} onClick={() => run(`greek:${scope}`, w)}>
            Search Greek <span className="text-gray-400">· {scope === 'GNT' ? 'NT' : 'LXX'}</span>
          </button>
        ) : (
          <button type="button" className={btn} onClick={() => run(`trans:${menu.transLang ?? 'en'}`, w)}>
            Search {transLabel}
          </button>
        )}
        <button type="button" className={btn} onClick={() => run('bg:all', w)}>
          Background texts <span className="text-gray-400">· Philo, Josephus, LXX…</span>
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500 pt-0.5">
        <span className="text-gray-400">Copy:</span>
        <button type="button" onClick={() => copy(w, 'word')} className="underline decoration-gray-300 hover:text-brand-700">word</button>
        {menu.lemma && <button type="button" onClick={() => copy(menu.lemma!, 'lemma')} className="underline decoration-gray-300 hover:text-brand-700">lemma</button>}
        {menu.reference && <button type="button" onClick={() => copy(menu.reference!, 'reference')} className="underline decoration-gray-300 hover:text-brand-700">reference</button>}
        {copied && <span className="text-green-600 inline-flex items-center gap-0.5"><Search size={10} /> copied {copied}</span>}
      </div>
    </div>
  )
}
