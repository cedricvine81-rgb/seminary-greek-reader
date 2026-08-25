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
import { FoldDefaultContext, XlitContext, XLIT_STORAGE_KEY, MorphContentProvider } from '../shared'
import { ChapterSidebar, FoldAllControls, useSectionToc } from '../ChapterSidebar'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'
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

const hbChapterCache: Record<string, ContentCatalogue> = {}
const hbChapterInflight: Record<string, Promise<ContentCatalogue>> = {}
function loadHebrewChapterContent(locale: string, chapter: string): Promise<ContentCatalogue> {
  const k = `${locale}.${chapter}`
  if (hbChapterCache[k]) return Promise.resolve(hbChapterCache[k])
  if (!hbChapterInflight[k]) hbChapterInflight[k] = fetch(`/data/morphology/${locale}/${chapter}.json`)
    .then(r => (r.ok ? r.json() : {}))
    .then((d: ContentCatalogue) => (hbChapterCache[k] = d))
    .catch(() => (hbChapterCache[k] = {}))
  return hbChapterInflight[k]
}

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

/**
 * `embedded` renders the Hebrew Grammar inside a side panel (the self-study plan opens its
 * READ steps this way) rather than as the full page: the chapter comes from a prop instead
 * of the URL, the chapter sidebar gives way to the compact dropdown, and sections start
 * expanded — there is no room for a sidebar beside the text at panel width. Mirrors the
 * same prop on the Greek MorphologyView.
 */
export function HebrewGrammarView({ embedded = false, initialChapter }: {
  embedded?: boolean
  initialChapter?: string
} = {}) {
  const t = useT()
  const [tab, setTab] = useState(
    initialChapter && HEBREW_TABS.some(x => x.id === initialChapter) ? initialChapter : HEBREW_TABS[0].id,
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Deep link: /grammar?chapter=qal-perfect — same parameter the Greek view honours.
  useEffect(() => {
    if (embedded) return   // the panel supplies the chapter as a prop; it owns no URL
    const c = new URLSearchParams(window.location.search).get('chapter')
    if (c && HEBREW_TABS.some(x => x.id === c)) setTab(c)
  }, [embedded])

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])


  // The open chapter's Spanish, fetched per chapter exactly as the Greek grammar does — an
  // English reader fetches nothing, and a chapter costs only its own prose. Buckets are
  // "hb-<chapter>" so a shared chapter name (nouns, pronouns) cannot collide with the Greek.
  const locale = useLocale()
  const [chapterContent, setChapterContent] = useState<ContentCatalogue>(NO_CONTENT)
  useEffect(() => {
    if (locale === 'en') { setChapterContent(NO_CONTENT); return }
    let alive = true
    loadHebrewChapterContent(locale, `hb-${tab}`).then(c => { if (alive) setChapterContent(c) })
    return () => { alive = false }
  }, [locale, tab])

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

  // Numbered sidebar + section outline (same pattern as the Greek view).
  const contentRef = useRef<HTMLDivElement>(null)
  const chapterNo = HEBREW_TABS.findIndex(x => x.id === tab) + 1
  const toc = useSectionToc(contentRef, chapterNo, [tab, locale, chapterContent, xlit])
  const sidebarGroups = [{
    heading: t('morph.chapters'),
    items: HEBREW_TABS.map((x, i) => ({ id: x.id, label: t(x.labelKey), no: i + 1 })),
  }]
  function goToChapter(id: string) {
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <MorphContentProvider value={chapterContent}>
    <XlitContext.Provider value={xlit}>
    <div className="flex flex-col min-h-0">
      {/* Mobile: chapters collapse into a hamburger, as in the Greek view. */}
      <div ref={menuRef} className={clsx(embedded ? '' : 'lg:hidden', 'relative')}>
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
              {HEBREW_TABS.map((x, i) => (
                <button
                  key={x.id}
                  onClick={() => { setTab(x.id); setMenuOpen(false) }}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    tab === x.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span className={tab === x.id ? 'opacity-70' : 'text-gray-400'}>{i + 1}. </span>
                  {t(x.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: numbered chapter sidebar (the 23-chip tab strip was the "too
          complicated" landing the self-study feedback named). */}
      <FoldDefaultContext.Provider value={embedded ? 'expanded' : 'collapsed'}>
      <div className={embedded ? '' : 'lg:flex lg:gap-8'}>
        {!embedded && (
          <ChapterSidebar
            groups={sidebarGroups}
            activeId={tab}
            onSelect={goToChapter}
            sections={toc}
          />
        )}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="min-w-0 text-base font-semibold text-gray-900">
                <span className="text-gray-400 font-normal">{t('morph.chapterNo', { n: chapterNo })}</span>
                {t(active.labelKey)}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <FoldAllControls />
                <button
                  onClick={toggleXlit}
                  aria-pressed={xlit}
                  title={t('morph.hb.xlitHint')}
                  className={clsx(
                    'hidden lg:inline-flex shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                    xlit ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:text-gray-800',
                  )}
                >
                  {t('morph.hb.xlit')}
                </button>
              </div>
            </div>
            <div ref={contentRef}>{active.content}</div>
          </div>
        </div>
      </div>
      </FoldDefaultContext.Provider>
    </div>
    </XlitContext.Provider>
    </MorphContentProvider>
  )
}
