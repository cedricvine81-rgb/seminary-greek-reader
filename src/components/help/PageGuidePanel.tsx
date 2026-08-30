'use client'

import { useEffect, useState } from 'react'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { content, NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'
import { loadContent } from '@/lib/i18n/content-load'
import Link from 'next/link'
import { X, HelpCircle, ArrowRight } from 'lucide-react'
import { PAGE_GUIDES, EXEGESIS_GUIDE_IDS, guideById, type PageGuide , resolveGuide } from '@/lib/page-guides'
import { useTrackValue } from '@/lib/track-client'
import { openPageGuide } from '@/lib/page-guide-bus'

// The page guide as a side panel beside the current page, following the Master Search panel's
// split-view treatment: on desktop the app content is squeezed rather than covered (globals.css
// keys off data-guide-panel), so you can follow the instructions with the actual page still in
// front of you. On mobile it is a full-screen sheet.
//
// Narrower and non-resizable by design — this is prose to read once, not a workspace.

const WIDTH = 420

export function PageGuidePanel({ guide, onClose }: { guide: PageGuide; onClose: () => void }) {
  const t = useT()
  const locale = useLocale()
  const hebrewTrack = useTrackValue() === 'hebrew'

  /**
   * The guide in the reader's language.
   *
   * Fetched when the panel opens rather than with the page: this is prose read once, and an
   * English reader must not pay for a translation they will never see. Until it arrives — and
   * for anything not yet translated, or translated against English that has since been
   * rewritten — `content` returns the English the guide was authored with, so the panel is
   * never blank and never stale.
   */
  const [cat, setCat] = useState<ContentCatalogue>(NO_CONTENT)
  useEffect(() => {
    if (locale === 'en') { setCat(NO_CONTENT); return }
    let live = true
    loadContent(locale, 'pageGuides').then(c => { if (live) setCat(c) }).catch(() => {})
    return () => { live = false }
  }, [locale])

  // Keys mirror scripts/i18n-content.ts: guide id, then the field's position in the guide.
  const face = hebrewTrack && guide.hebrew ? 'hebrew.' : ''
  const say = (part: string, english: string) =>
    content(cat, `guide.${guide.id}.${face}${part}`, english)
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
            <HelpCircle size={13} /> {t('help.aboutThisPage')}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-gray-900">{say('title', guide.title)}</h2>
        </div>
        <button onClick={onClose} aria-label={t('action.close')} className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
        <p className="text-sm leading-relaxed text-gray-700">{say('lede', guide.lede)}</p>

        {guide.sections.map((s, i) => (
          <div key={s.heading}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{say(`s${i}.h`, s.heading)}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{say(`s${i}.b`, s.body)}</p>
          </div>
        ))}

        {guide.gestures && guide.gestures.length > 0 && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 px-3.5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-2">
              {t('help.worthKnowing')}
            </h3>
            <ul className="space-y-2">
              {guide.gestures.map((g, i) => (
                <li key={g.does} className="text-sm leading-snug text-gray-700">
                  <span className="font-medium text-gray-900">{say(`g${i}.does`, g.does)}</span>
                  <span className="text-gray-400"> — </span>
                  {say(`g${i}.gets`, g.gets)}
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
              {t(tabPickerOpen ? 'help.hideOtherViews' : 'help.otherViews')}
            </button>
            {tabPickerOpen && (
              <div className="mt-2 space-y-0.5">
                {EXEGESIS_GUIDE_IDS.filter(id => id !== guide.id).map(id => {
                  const raw = guideById(id)
                  const g = raw && resolveGuide(raw, hebrewTrack)
                  if (!g) return null
                  const other = (part: string, english: string) =>
                    content(cat, `guide.${id}.${hebrewTrack && raw?.hebrew ? 'hebrew.' : ''}${part}`, english)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openPageGuide(id)}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {other('title', g.title).replace(/^(Exegesis|Exégesis) · /, '')}
                      <span className="block text-xs text-gray-400">{other('lede', g.lede)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {guide.related && guide.related.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{t('action.next')}</h3>
            <div className="space-y-0.5">
              {guide.related.map((r, i) => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
                >
                  <ArrowRight size={13} className="shrink-0 text-brand-400" /> {say(`r${i}`, r.label)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Browse the rest of the app's tools. */}
        <div className="border-t border-gray-100 pt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">{t('help.otherPages')}</h3>
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
