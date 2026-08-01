'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, HelpCircle, ArrowRight } from 'lucide-react'
import { PAGE_GUIDES, EXEGESIS_GUIDE_IDS, guideById, type PageGuide } from '@/lib/page-guides'
import { openPageGuide } from '@/lib/page-guide-bus'

// The page guide as a side panel beside the current page, following the Master Search panel's
// split-view treatment: on desktop the app content is squeezed rather than covered (globals.css
// keys off data-guide-panel), so you can follow the instructions with the actual page still in
// front of you. On mobile it is a full-screen sheet.
//
// Narrower and non-resizable by design — this is prose to read once, not a workspace.

const WIDTH = 420

export function PageGuidePanel({ guide, onClose }: { guide: PageGuide; onClose: () => void }) {
  // Which Exegesis sub-guide is being read, when the panel is showing one.
  const [tabPickerOpen, setTabPickerOpen] = useState(false)

  // Squeeze the page rather than cover it (desktop) — same mechanism as the search panel.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-guide-panel', '1')
    root.style.setProperty('--guide-panel-w', `${WIDTH}px`)
    return () => {
      root.removeAttribute('data-guide-panel')
      root.style.removeProperty('--guide-panel-w')
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Reading an Exegesis tab's guide? Offer the other eight without leaving the panel.
  const isExegesisTab = guide.id.startsWith('exegesis:')
  const otherPages = PAGE_GUIDES.filter(g => !g.id.startsWith('exegesis:') && g.id !== guide.id)

  return (
    <div
      className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:right-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[var(--panel-w)] flex flex-col bg-surface border-l border-gray-200 shadow-xl"
      style={{ '--panel-w': `${WIDTH}px` } as React.CSSProperties}
      role="dialog"
      aria-label={`About ${guide.title}`}
    >
      {/* Header */}
      <div className="flex-none flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <HelpCircle size={13} /> About this page
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-gray-900">{guide.title}</h2>
        </div>
        <button onClick={onClose} aria-label="Close" className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
        <p className="text-sm leading-relaxed text-gray-700">{guide.lede}</p>

        {guide.sections.map(s => (
          <div key={s.heading}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{s.heading}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{s.body}</p>
          </div>
        ))}

        {guide.gestures && guide.gestures.length > 0 && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-3.5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">
              Worth knowing
            </h3>
            <ul className="space-y-2">
              {guide.gestures.map(g => (
                <li key={g.does} className="text-sm leading-snug text-gray-700">
                  <span className="font-medium text-gray-900">{g.does}</span>
                  <span className="text-gray-400"> — </span>
                  {g.gets}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The other eight Exegesis views, readable without switching tabs first. */}
        {isExegesisTab && (
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setTabPickerOpen(o => !o)}
              className="text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-700"
            >
              {tabPickerOpen ? 'Hide the other views' : 'About the other views'}
            </button>
            {tabPickerOpen && (
              <div className="mt-2 space-y-0.5">
                {EXEGESIS_GUIDE_IDS.filter(id => id !== guide.id).map(id => {
                  const g = guideById(id)
                  if (!g) return null
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openPageGuide(id)}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {g.title.replace(/^Exegesis · /, '')}
                      <span className="block text-xs text-gray-400">{g.lede}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {guide.related && guide.related.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Next</h3>
            <div className="space-y-0.5">
              {guide.related.map(r => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
                >
                  <ArrowRight size={13} className="shrink-0 text-brand-400" /> {r.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Browse the rest of the app's tools. */}
        <div className="border-t border-gray-100 pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Other pages</h3>
          <div className="flex flex-wrap gap-1.5">
            {otherPages.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => openPageGuide(g.id)}
                className="rounded-lg border border-gray-200 bg-surface px-2.5 py-1 text-xs text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {g.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
