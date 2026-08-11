'use client'

import { useMemo, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { Check, X } from 'lucide-react'

// Limiting a construct to particular books or works. The biblical corpora scope by book and are
// shown as an abbreviation grid (27 or 54 of them, and everyone knows the abbreviations); the prose
// corpora scope by WORK and are shown as a searchable list, because "Plutarch, Life of Antony"
// doesn't abbreviate usefully and Greco-Roman alone has 49 of them.
//
// The manifest is built alongside the indexes (public/data/construct/works.json), so the options
// are always exactly what is searchable.

export interface ScopeEntry {
  id: string
  label: string
  short: string
  group: string
}

export function ConstructScopePicker({ entries, selected, onChange, onClose, biblical }: {
  entries: ScopeEntry[]
  selected: string[]
  onChange: (ids: string[]) => void
  onClose: () => void
  biblical: boolean
}) {
  const t = useT()
  const [filter, setFilter] = useState('')
  const chosen = new Set(selected)

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const shown = q ? entries.filter(e => e.label.toLowerCase().includes(q)) : entries
    const byGroup = new Map<string, ScopeEntry[]>()
    for (const e of shown) {
      const list = byGroup.get(e.group)
      if (list) list.push(e); else byGroup.set(e.group, [e])
    }
    return Array.from(byGroup.entries())
  }, [entries, filter])

  const toggle = (id: string) =>
    onChange(chosen.has(id) ? selected.filter(x => x !== id) : [...selected, id])
  const toggleMany = (ids: string[], select: boolean) =>
    onChange(select ? Array.from(new Set([...selected, ...ids])) : selected.filter(x => !ids.includes(x)))

  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-2.5 py-1.5">
        <span className="text-[11px] text-gray-500">
          {selected.length === 0
            ? `Searching all ${biblical ? 'books' : 'works'}`
            : `${selected.length} selected`}
        </span>
        <span className="flex items-center gap-2">
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-[11px] text-brand-600 hover:underline">
              Clear
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </span>
      </div>

      {/* 49 Greco-Roman works is too many to scan, so the list is filterable. */}
      {!biblical && (
        <div className="border-b border-gray-100 px-2.5 py-1.5">
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder={t('cq.filterWorks')}
            className="w-full rounded-md border border-gray-300 bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      )}

      <div className="max-h-[30vh] overflow-y-auto p-2">
        {groups.length === 0 && <p className="py-4 text-center text-xs text-gray-400">Nothing matches that.</p>}
        {groups.map(([heading, list]) => {
          const ids = list.map(e => e.id)
          const allOn = ids.every(id => chosen.has(id))
          return (
            <div key={heading} className="mb-2 last:mb-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">{heading}</p>
                {list.length > 1 && (
                  <button type="button" onClick={() => toggleMany(ids, !allOn)}
                    className="flex-none text-[10px] text-brand-600 hover:underline">
                    {allOn ? t('cq.deselectAll') : t('cq.selectAll')}
                  </button>
                )}
              </div>
              {biblical ? (
                <div className="grid grid-cols-6 gap-1">
                  {list.map(e => (
                    <button key={e.id} type="button" onClick={() => toggle(e.id)} title={e.label}
                      className={`rounded-lg border px-0.5 py-1 text-[11px] font-medium leading-none transition-colors ${
                        chosen.has(e.id)
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-gray-200 bg-surface text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700'}`}>
                      {e.short}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {list.map(e => (
                    <button key={e.id} type="button" onClick={() => toggle(e.id)}
                      className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs transition-colors ${
                        chosen.has(e.id) ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className={`flex h-3.5 w-3.5 flex-none items-center justify-center rounded border ${
                        chosen.has(e.id) ? 'border-brand-400 bg-brand-500 text-white' : 'border-gray-300'}`}>
                        {chosen.has(e.id) && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span className="truncate">{e.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
