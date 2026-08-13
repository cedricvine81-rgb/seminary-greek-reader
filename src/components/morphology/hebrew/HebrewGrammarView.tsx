'use client'
/* ─────────────────────────────────────────────
   The Hebrew grammar — /grammar on the Hebrew track.

   The Hebrew sibling of MorphologyView, deliberately simpler: no
   Beginning/Intermediate toggle (an instructor decision, per the user),
   no course-progress overlay, no Greek Essentials spine. Twenty-two
   chapters covering a standard first year, ordered forms-first the way
   the Greek chapters follow the Greek course.

   English-only for now: the chapters carry no translation ids, so every
   locale reads the English (the content-catalogue fallback rule). Tab
   labels are ordinary i18n keys.
───────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Menu } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { XlitContext, XLIT_STORAGE_KEY } from '../shared'
import { HB_ALPHABET } from './alphabet'
import { HB_VOWELS } from './vowels'
import { HB_ARTICLE } from './article'
import { HB_PREPOSITIONS } from './prepositions'
import { HB_NOUNS } from './nouns'
import { HB_CONSTRUCT } from './construct'
import { HB_ADJECTIVES } from './adjectives'
import { HB_PRONOUNS } from './pronouns'
import { HB_SUFFIXES } from './suffixes'
import { HB_NUMBERS } from './numbers'
import { HB_VERB_SYSTEM } from './verb-system'
import { HB_QAL_PERFECT } from './qal-perfect'
import { HB_QAL_IMPERFECT } from './qal-imperfect'
import { HB_WAW } from './waw-consecutive'
import { HB_VOLITIVES } from './volitives'
import { HB_INFINITIVES } from './infinitives'
import { HB_PARTICIPLES } from './participles'
import { HB_NIPHAL } from './niphal'
import { HB_PIEL_PUAL } from './piel-pual'
import { HB_HIPHIL_HOPHAL } from './hiphil-hophal'
import { HB_HITHPAEL } from './hithpael'
import { HB_WEAK_VERBS } from './weak-verbs'
import { HB_SYNTAX } from './syntax'

// Order follows a standard first-year sequence: script → the nominal system →
// the verb, Qal before the derived stems, weak verbs and syntax as capstones.
const HEBREW_TABS = [
  { id: 'alphabet', labelKey: 'morph.hb.tab.alphabet', content: HB_ALPHABET },
  { id: 'vowels', labelKey: 'morph.hb.tab.vowels', content: HB_VOWELS },
  { id: 'article', labelKey: 'morph.hb.tab.article', content: HB_ARTICLE },
  { id: 'prepositions', labelKey: 'morph.hb.tab.prepositions', content: HB_PREPOSITIONS },
  { id: 'nouns', labelKey: 'morph.hb.tab.nouns', content: HB_NOUNS },
  { id: 'construct', labelKey: 'morph.hb.tab.construct', content: HB_CONSTRUCT },
  { id: 'adjectives', labelKey: 'morph.hb.tab.adjectives', content: HB_ADJECTIVES },
  { id: 'pronouns', labelKey: 'morph.hb.tab.pronouns', content: HB_PRONOUNS },
  { id: 'suffixes', labelKey: 'morph.hb.tab.suffixes', content: HB_SUFFIXES },
  { id: 'numbers', labelKey: 'morph.hb.tab.numbers', content: HB_NUMBERS },
  { id: 'verb-system', labelKey: 'morph.hb.tab.verb-system', content: HB_VERB_SYSTEM },
  { id: 'qal-perfect', labelKey: 'morph.hb.tab.qal-perfect', content: HB_QAL_PERFECT },
  { id: 'qal-imperfect', labelKey: 'morph.hb.tab.qal-imperfect', content: HB_QAL_IMPERFECT },
  { id: 'waw-consecutive', labelKey: 'morph.hb.tab.waw-consecutive', content: HB_WAW },
  { id: 'volitives', labelKey: 'morph.hb.tab.volitives', content: HB_VOLITIVES },
  { id: 'infinitives', labelKey: 'morph.hb.tab.infinitives', content: HB_INFINITIVES },
  { id: 'participles', labelKey: 'morph.hb.tab.participles', content: HB_PARTICIPLES },
  { id: 'niphal', labelKey: 'morph.hb.tab.niphal', content: HB_NIPHAL },
  { id: 'piel-pual', labelKey: 'morph.hb.tab.piel-pual', content: HB_PIEL_PUAL },
  { id: 'hiphil-hophal', labelKey: 'morph.hb.tab.hiphil-hophal', content: HB_HIPHIL_HOPHAL },
  { id: 'hithpael', labelKey: 'morph.hb.tab.hithpael', content: HB_HITHPAEL },
  { id: 'weak-verbs', labelKey: 'morph.hb.tab.weak-verbs', content: HB_WEAK_VERBS },
  { id: 'syntax', labelKey: 'morph.hb.tab.syntax', content: HB_SYNTAX },
]

export function HebrewGrammarView() {
  const t = useT()
  const [tab, setTab] = useState(HEBREW_TABS[0].id)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Deep link: /grammar?chapter=qal-perfect — same parameter the Greek view honours.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('chapter')
    if (c && HEBREW_TABS.some(x => x.id === c)) setTab(c)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])


  // Transliteration toggle: beginners read the pronunciation beside the Hebrew until they
  // no longer need it. Remembered per device (localStorage, like the other reading prefs).
  const [xlit, setXlit] = useState(false)
  useEffect(() => { try { setXlit(localStorage.getItem(XLIT_STORAGE_KEY) === '1') } catch {} }, [])
  function toggleXlit() {
    setXlit(v => {
      const nv = !v
      try { localStorage.setItem(XLIT_STORAGE_KEY, nv ? '1' : '0') } catch {}
      return nv
    })
  }
  const active = HEBREW_TABS.find(x => x.id === tab) ?? HEBREW_TABS[0]

  return (
    <XlitContext.Provider value={xlit}>
    <div className="flex flex-col min-h-0">
      {/* Mobile: chapters collapse into a hamburger, as in the Greek view. */}
      <div ref={menuRef} className="lg:hidden relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 py-2 border-b border-gray-100 bg-surface text-left"
        >
          <span className="text-sm font-semibold text-gray-900 truncate">{t(active.labelKey)}</span>
          <Menu size={18} className="text-gray-500 shrink-0" />
        </button>
        <button
          onClick={toggleXlit}
          aria-pressed={xlit}
          className={clsx(
            'absolute end-9 top-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors',
            xlit ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500',
          )}
        >
          {t('morph.hb.xlit')}
        </button>
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[70svh] overflow-y-auto bg-popover border border-gray-200 rounded-xl p-3 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 px-1">{t('morph.topics')}</p>
            <div className="flex flex-wrap gap-1.5">
              {HEBREW_TABS.map(x => (
                <button
                  key={x.id}
                  onClick={() => { setTab(x.id); setMenuOpen(false) }}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    tab === x.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {t(x.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: inline chapter tab bar. */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-center gap-1.5 py-2 border-b border-gray-100 bg-surface">
          {HEBREW_TABS.map(x => (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                tab === x.id ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {t(x.labelKey)}
            </button>
          ))}
          <button
            onClick={toggleXlit}
            aria-pressed={xlit}
            title={t('morph.hb.xlitHint')}
            className={clsx(
              'ms-auto shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
              xlit ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:text-gray-800',
            )}
          >
            {t('morph.hb.xlit')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="py-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t(active.labelKey)}</h2>
          {active.content}
        </div>
      </div>
    </div>
    </XlitContext.Provider>
  )
}
