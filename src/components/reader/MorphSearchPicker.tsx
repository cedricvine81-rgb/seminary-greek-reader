'use client'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { X, Search } from 'lucide-react'
import { MORPH_GROUPS } from '@/lib/morph-features'

// "Search by morphology". Opens pre-filled with some initial features (e.g. the right-clicked
// word's own parsing); toggle which to keep, optionally restrict to a lemma, then search the GNT
// for every verse containing a word that matches. NT-only (the parsing trees are GNT). Decoupled
// from a live word so both the Reader and the /search page (Edit criteria) can drive it.
export function MorphSearchPicker({ initialFeatures, lemma, subject, initialRestrictLemma = false, onSearch, onClose }: {
  initialFeatures: string[]
  lemma: string | null              // a lemma available to restrict to (null → no lemma option)
  subject?: string                  // header caption, e.g. "γενέσεως · Noun, Genitive, Singular"
  initialRestrictLemma?: boolean
  onSearch: (features: string[], lemma: string | null) => void
  onClose: () => void
}) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialFeatures))
  const [restrictLemma, setRestrictLemma] = useState(initialRestrictLemma)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOutside) }
  }, [onClose])

  const toggle = (v: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(v) ? next.delete(v) : next.add(v)
    return next
  })

  const features = Array.from(selected)
  const canSearch = features.length > 0 || restrictLemma

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4">
      <div ref={ref} className="w-full sm:max-w-lg max-h-[85vh] bg-popover rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-800">{t('reader.searchByMorphology')}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {subject ? <span className="greek-text">{subject}</span> : null}
              {subject ? ' · ' : ''}New Testament
            </p>
          </div>
          <button onClick={onClose} aria-label={t('action.close')} className="text-gray-400 hover:text-gray-600 p-1 -mr-1"><X size={18} /></button>
        </div>

        {/* Feature groups */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {MORPH_GROUPS.map(g => (
            <div key={g.key}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.features.map(feat => {
                  const on = selected.has(feat.value)
                  return (
                    <button key={feat.value} type="button" onClick={() => toggle(feat.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${on
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-surface border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'}`}>
                      {feat.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {lemma && (
            <label className="flex items-center gap-2 pt-1 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={restrictLemma} onChange={e => setRestrictLemma(e.target.checked)}
                className="accent-brand-600" />
              {t('reader.onlyThisLemma')}<span className="greek-text">{lemma}</span>)
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
          <button type="button" onClick={() => { setSelected(new Set()); setRestrictLemma(false) }}
            className="text-xs text-gray-500 hover:text-gray-700">{t('action.clear')}</button>
          <button type="button" disabled={!canSearch}
            onClick={() => onSearch(features, restrictLemma ? lemma : null)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700 transition-colors">
            <Search size={15} /> {t('reader.search')}
          </button>
        </div>
      </div>
    </div>
  )
}
