'use client'

/* ─────────────────────────────────────────────
   MorphologyView — shell

   Tab navigation + the Beginning/Intermediate level toggle. All chapter
   content lives in src/components/morphology/chapters/*, shared building
   blocks (tables, asides, glossary terms, practice) in
   src/components/morphology/shared.tsx.
───────────────────────────────────────────── */

import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { Menu, GraduationCap, ListChecks, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { ESS_EXPLANATIONS, TAB_EXPLANATIONS, type Explanation } from './morphology-explanations'
import { LevelContext, MorphContentProvider, type MorphLevel } from '@/components/morphology/shared'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { NO_CONTENT, type ContentCatalogue } from '@/lib/i18n/content'
import { TranslationWorkbench } from '@/components/morphology/TranslationWorkbench'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { ESS_SECTIONS } from '@/components/morphology/chapters/essentials'
import { PRONUNCIATION_CONTENT } from '@/components/morphology/chapters/pronunciation'
import { PARSING_CONTENT } from '@/components/morphology/chapters/parsing'
import { NOUNS_CONTENT } from '@/components/morphology/chapters/nouns'
import { PRONOUNS_CONTENT } from '@/components/morphology/chapters/pronouns'
import { DEMONSTRATIVES_CONTENT } from '@/components/morphology/chapters/demonstratives'
import { RELATIVES_CONTENT } from '@/components/morphology/chapters/relatives'
import { CONTRACT_VERBS_CONTENT } from '@/components/morphology/chapters/contract-verbs'
import { LIQUIDS_CONTENT } from '@/components/morphology/chapters/liquids'
import { PRINCIPAL_PARTS_CONTENT } from '@/components/morphology/chapters/principal-parts'
import { PREPOSITIONS_CONTENT } from '@/components/morphology/chapters/prepositions'
import { CONJUNCTIONS_CONTENT } from '@/components/morphology/chapters/conditionals'
import { CONJ_ADV_CONTENT } from '@/components/morphology/chapters/conj-adv'
import { INDICATIVES_CONTENT } from '@/components/morphology/chapters/indicatives'
import { INFINITIVES_CONTENT } from '@/components/morphology/chapters/infinitives'
import { IMPERATIVES_CONTENT } from '@/components/morphology/chapters/imperatives'
import { PARTICIPLES_CONTENT } from '@/components/morphology/chapters/participles'
import { SUBJUNCTIVES_CONTENT } from '@/components/morphology/chapters/subjunctives'
import { MI_VERBS_CONTENT } from '@/components/morphology/chapters/mi-verbs'
import { SECOND_AORISTS_CONTENT } from '@/components/morphology/chapters/second-aorists'
import { DEPONENTS_CONTENT } from '@/components/morphology/chapters/deponents'

/* ─────────────────────────────────────────────
   Beginning / Intermediate explanations
───────────────────────────────────────────── */

const LEVELS: { id: MorphLevel; label: string }[] = [
  { id: 'beginning',    label: 'Beginning'    },
  { id: 'intermediate', label: 'Intermediate' },
]

/** Segmented Beginning ⇄ Intermediate control. */
function LevelToggle({ level, onChange }: { level: MorphLevel; onChange: (l: MorphLevel) => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="tablist" aria-label="Explanation level">
      {LEVELS.map(l => (
        <button
          key={l.id}
          role="tab"
          aria-selected={level === l.id}
          onClick={() => onChange(l.id)}
          className={clsx(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            level === l.id ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

/** Teaching-note card that renders the current level's explanation. */
function ExplanationCard({ explanation, level }: { explanation?: Explanation; level: MorphLevel }) {
  if (!explanation) return null
  return (
    <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <GraduationCap size={15} className="text-brand-600 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {level === 'beginning' ? 'Getting started' : 'Going deeper'}
        </span>
      </div>
      {level === 'beginning' ? explanation.beginning : explanation.intermediate}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Top-level tab definitions
───────────────────────────────────────────── */

export type MainTab = 'essentials' | 'pronunciation' | 'parsing' | 'nouns' | 'pronouns' | 'demonstratives' | 'relatives' | 'prepositions' |
               'conjunctions' | 'conj-adv' | 'indicatives' | 'contract-verbs' | 'liquids' | 'principal-parts' |
               'infinitives' | 'imperatives' | 'participles' | 'subjunctives' | 'mi-verbs' |
               '2nd-aorists' | 'deponents'

// Tab order follows the Beginning Greek course sequence (Lessons 1–10,
// working through the Eight Minimums): nouns & friends (L3–4), the verb
// system (L5–6), participles (L7), the other moods (L8), μι-verbs (L9),
// basic syntax (L10), with the Black-based Conj. & Adv. as the capstone.
// Phase-4 topics slot into their natural lesson positions: demonstratives
// and relatives after Pronouns, contract verbs after Indicatives, liquids
// beside 2nd Aorists, and Principal Parts closing the verb block.
const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'essentials',      label: 'Minimums'       },
  { id: 'pronunciation',   label: 'Pronunciation'   },
  // Sits before the first paradigm on purpose: the student learns the shape of
  // the ANSWER (which slots, in what order) before meeting forms to fill it in.
  { id: 'parsing',         label: 'Parsing'         },
  { id: 'nouns',           label: 'Nouns/Adj.'      },
  { id: 'prepositions',    label: 'Prepositions'    },
  { id: 'pronouns',        label: 'Pronouns'        },
  { id: 'demonstratives',  label: 'Demonstratives'  },
  { id: 'relatives',       label: 'Relatives'       },
  { id: 'indicatives',     label: 'Indicatives'     },
  { id: 'contract-verbs',  label: 'Contract Verbs'  },
  { id: 'deponents',       label: 'Deponents'       },
  { id: '2nd-aorists',     label: '2nd Aorists'     },
  { id: 'liquids',         label: 'Liquid Verbs'    },
  { id: 'principal-parts', label: 'Principal Parts' },
  { id: 'participles',     label: 'Participles'     },
  { id: 'subjunctives',    label: 'Subjunctives'    },
  { id: 'imperatives',     label: 'Imperatives'     },
  { id: 'infinitives',     label: 'Infinitives'     },
  { id: 'mi-verbs',        label: 'μι-Verbs'        },
  { id: 'conjunctions',    label: 'Conditionals'    },
  { id: 'conj-adv',        label: 'Conj. & Adv.'    },
]

/**
 * A chapter's translated prose, fetched per chapter (public/data/morphology/<loc>/<tab>.json,
 * generated by scripts/i18n-content.ts — the tab id IS the chapter file name, so it is also the
 * catalogue's name).
 *
 * Fetched rather than served as a prop because this view is mounted twice: on /grammar, and in
 * the grammar panel that GrammarPanelProvider puts in the ROOT LAYOUT. A server-loaded catalogue
 * would therefore ride along with every page in the app — the exact cost content-load.ts exists
 * to avoid. An English reader fetches nothing at all.
 */
const chapterCache: Record<string, ContentCatalogue> = {}
const chapterInflight: Record<string, Promise<ContentCatalogue>> = {}
function loadChapterContent(locale: string, chapter: string): Promise<ContentCatalogue> {
  const k = `${locale}.${chapter}`
  if (chapterCache[k]) return Promise.resolve(chapterCache[k])
  if (!chapterInflight[k]) chapterInflight[k] = fetch(`/data/morphology/${locale}/${chapter}.json`)
    .then(r => (r.ok ? r.json() : {}))
    .then((d: ContentCatalogue) => (chapterCache[k] = d))
    .catch(() => (chapterCache[k] = {}))
  return chapterInflight[k]
}

const REVISION_CONTENT: Record<MainTab, React.ReactNode> = {
  essentials:        null,
  pronunciation:     PRONUNCIATION_CONTENT,
  parsing:           PARSING_CONTENT,
  nouns:             NOUNS_CONTENT,
  pronouns:          PRONOUNS_CONTENT,
  demonstratives:    DEMONSTRATIVES_CONTENT,
  relatives:         RELATIVES_CONTENT,
  prepositions:      PREPOSITIONS_CONTENT,
  conjunctions:      CONJUNCTIONS_CONTENT,
  'conj-adv':        CONJ_ADV_CONTENT,
  indicatives:       INDICATIVES_CONTENT,
  'contract-verbs':  CONTRACT_VERBS_CONTENT,
  liquids:           LIQUIDS_CONTENT,
  'principal-parts': PRINCIPAL_PARTS_CONTENT,
  infinitives:       INFINITIVES_CONTENT,
  imperatives:       IMPERATIVES_CONTENT,
  participles:       PARTICIPLES_CONTENT,
  subjunctives:      SUBJUNCTIVES_CONTENT,
  'mi-verbs':        MI_VERBS_CONTENT,
  '2nd-aorists':     SECOND_AORISTS_CONTENT,
  deponents:         DEPONENTS_CONTENT,
}

/* ─────────────────────────────────────────────
   Course mode (Phase 5a/5b)

   An opt-in overlay that turns the ordered tabs into a guided course:
   progress header, chapter numbering, prev/next navigation, and a
   per-chapter "mark complete". Completion state comes from
   useCourseProgress (localStorage + the signed-in user's account).
   Minimums stays outside the path as the reference spine.
───────────────────────────────────────────── */

const COURSE_CHAPTERS = MAIN_TABS.filter(t => t.id !== 'essentials')

/** Small pill that switches course mode on/off, next to the level toggle. */
function CourseToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      className={clsx(
        'inline-flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors',
        on ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900'
      )}
    >
      <ListChecks size={14} />
      Course
    </button>
  )
}

/** Progress bar + continue button shown above the content in course mode. */
function CourseHeader({ completed, goTo }: { completed: Set<string>; goTo: (id: MainTab) => void }) {
  const done = COURSE_CHAPTERS.filter(c => completed.has(c.id)).length
  const next = COURSE_CHAPTERS.find(c => !completed.has(c.id))
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <ListChecks size={16} className="text-brand-600 shrink-0" />
      <div className="flex-1 min-w-[10rem]">
        <p className="text-sm font-medium text-gray-800">
          Course progress · {done} of {COURSE_CHAPTERS.length} chapters
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${(done / COURSE_CHAPTERS.length) * 100}%` }}
          />
        </div>
      </div>
      {next ? (
        <button
          onClick={() => goTo(next.id)}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          {done > 0 ? 'Continue' : 'Start'}: {next.label} →
        </button>
      ) : (
        <span className="text-sm font-medium text-green-600">All chapters complete 🎉</span>
      )}
    </div>
  )
}

/** Prev / mark-complete / next bar at the foot of each chapter in course mode. */
function CourseNav({ index, completed, onComplete, goTo }: {
  index: number
  completed: Set<string>
  onComplete: (id: MainTab, done: boolean) => void
  goTo: (id: MainTab) => void
}) {
  const cur = COURSE_CHAPTERS[index]
  const prev = index > 0 ? COURSE_CHAPTERS[index - 1] : null
  const next = index < COURSE_CHAPTERS.length - 1 ? COURSE_CHAPTERS[index + 1] : null
  const done = completed.has(cur.id)
  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
      {prev && (
        <button
          onClick={() => goTo(prev.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={15} /> {prev.label}
        </button>
      )}
      <div className="flex-1" />
      <button
        onClick={() => onComplete(cur.id, !done)}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium text-white transition-colors',
          done ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-600 hover:bg-brand-700'
        )}
      >
        <Check size={15} /> {done ? 'Completed — tap to undo' : 'Mark chapter complete'}
      </button>
      <div className="flex-1" />
      {next && (
        <button
          onClick={() => goTo(next.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          {next.label} <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */

/**
 * `embedded` renders the Grammar inside the side panel opened from the Reader's syntax menu
 * (GrammarPanel), rather than as the full page. Two differences: the chapter/level come from
 * props instead of the URL — the panel owns no address bar — and the compact chapter menu is
 * used at every width, because the desktop tab bar's 21 chips are unusable in a 620px panel
 * and CSS media queries see the viewport, not the panel.
 */
export function MorphologyView({
  embedded = false,
  initialChapter,
  initialLevel,
  onRequestClose,
}: {
  embedded?: boolean
  initialChapter?: MainTab
  initialLevel?: MorphLevel
  onRequestClose?: () => void
} = {}) {
  const [mainTab, setMainTab] = useState<MainTab>(initialChapter ?? 'essentials')
  const [essId, setEssId]     = useState(1)

  // Beginning / Intermediate explanation level. Beginning is the DEFAULT on
  // every fresh visit; the choice is remembered only for the current browser
  // session (sessionStorage), so the Grammar pages always open at Beginning
  // rather than whatever a student picked weeks ago. Hydrate after first
  // paint to avoid a hydration mismatch.
  const [level, setLevel] = useState<MorphLevel>(initialLevel ?? 'beginning')

  // The open chapter's translated prose. Keyed by chapter, so moving between chapters fetches
  // only what is newly needed, and English fetches nothing.
  const locale = useLocale()
  const [chapterContent, setChapterContent] = useState<ContentCatalogue>(NO_CONTENT)
  useEffect(() => {
    if (locale === 'en') { setChapterContent(NO_CONTENT); return }
    let alive = true
    loadChapterContent(locale, mainTab).then(c => { if (alive) setChapterContent(c) })
    return () => { alive = false }
  }, [locale, mainTab])

  useEffect(() => {
    if (initialLevel) return   // the panel was opened at an explicit level — don't override it
    try {
      const saved = sessionStorage.getItem('morph-level')
      if (saved === 'beginning' || saved === 'intermediate') setLevel(saved)
      localStorage.removeItem('morph-level') // retire the old cross-visit memory
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  function changeLevel(l: MorphLevel) {
    setLevel(l)
    try { sessionStorage.setItem('morph-level', l) } catch { /* ignore */ }
  }

  // Deep link: /grammar?chapter=nouns&level=intermediate. The Reader's right-click syntax
  // menu links here from a word's syntactic category, so a student can go from "Partitive
  // Genitive" on a word straight to the section that teaches it, at the level the category is
  // pitched at.
  //
  // Runs AFTER the sessionStorage effect above so an explicit level in the URL wins over the
  // remembered one. Reads window.location rather than useSearchParams: the page is otherwise
  // static, and useSearchParams would opt it into dynamic rendering (and want a Suspense
  // boundary) for what is a one-shot read on mount.
  useEffect(() => {
    if (embedded) return   // the panel supplies chapter/level as props; it owns no URL
    try {
      const params = new URLSearchParams(window.location.search)
      const chapter = params.get('chapter')
      if (chapter && MAIN_TABS.some(t => t.id === chapter)) setMainTab(chapter as MainTab)
      const l = params.get('level')
      if (l === 'beginning' || l === 'intermediate') setLevel(l)
    } catch { /* ignore */ }
  }, [])

  // Course mode (opt-in overlay). Same hydrate-from-localStorage pattern as
  // the level toggle; completion state via useCourseProgress (local + account).
  const [courseMode, setCourseMode] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('morph-course-mode') === '1') setCourseMode(true)
  }, [])
  function toggleCourse() {
    setCourseMode(on => {
      try { localStorage.setItem('morph-course-mode', on ? '0' : '1') } catch { /* ignore */ }
      return !on
    })
  }
  const { completed, setChapter } = useCourseProgress()
  function goToChapter(id: MainTab) {
    setMainTab(id)
    window.scrollTo({ top: 0 })
  }
  const chapterIndex = COURSE_CHAPTERS.findIndex(c => c.id === mainTab)

  // Mobile only: the topic tabs + Minimums sections collapse into a hamburger menu
  // (desktop keeps the inline bars). Close it on an outside click.
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const activeEss = ESS_SECTIONS.find(s => s.id === essId)!

  return (
    <MorphContentProvider value={chapterContent}>
    <div className="flex flex-col min-h-0">
      {/* Translation Workbench side panel (opened from ClassSentences blocks). */}
      <TranslationWorkbench />
      {/* Mobile — and the side panel at any width — collapse the topic tabs into a hamburger. */}
      <div ref={menuRef} className={`${embedded ? '' : 'lg:hidden'} relative`}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 py-2 border-b border-gray-100 bg-surface text-left"
        >
          <span className="text-sm font-semibold text-gray-900 truncate">
            {MAIN_TABS.find(t => t.id === mainTab)?.label}
            {mainTab === 'essentials' && <span className="text-gray-400 font-normal"> · {activeEss.label}</span>}
          </span>
          <Menu size={18} className="text-gray-500 shrink-0" />
        </button>
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[70svh] overflow-y-auto bg-popover border border-gray-200 rounded-xl p-3 shadow-lg space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 px-1">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {MAIN_TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setMainTab(t.id); if (t.id !== 'essentials') setMenuOpen(false) }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      mainTab === t.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {t.label}
                    {courseMode && completed.has(t.id) && (
                      <span className={clsx('ml-1', mainTab === t.id ? 'text-white' : 'text-green-600')}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {mainTab === 'essentials' && (
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5 px-1">Section</p>
                <div className="flex flex-wrap gap-1.5">
                  {ESS_SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setEssId(s.id); setMenuOpen(false) }}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-sm font-medium transition-colors',
                        essId === s.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: inline topic tab bar. Never in the panel — 21 chips don't fit 620px. */}
      <div className={embedded ? 'hidden' : 'hidden lg:block'}>
        <div className="flex flex-wrap gap-1.5 py-2 border-b border-gray-100 bg-surface">
          {MAIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                t.id === 'essentials'
                  ? 'bg-brand-600 text-white'
                  : mainTab === t.id
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {t.label}
              {courseMode && completed.has(t.id) && <span className="ml-1 text-green-600">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <LevelContext.Provider value={level}>
      <div className="flex-1 overflow-y-auto">
        {courseMode && <CourseHeader completed={completed} goTo={goToChapter} />}
        {mainTab === 'essentials' ? (
          <>
            {/* Ess. 1–8 sub-navigation (desktop; mobile and the panel use the hamburger) */}
            <div className={`${embedded ? 'hidden' : 'hidden lg:flex'} gap-1.5 flex-wrap py-3 border-b border-gray-100 bg-surface`}>
              {ESS_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setEssId(s.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-sm font-medium transition-colors',
                    essId === s.id ? 'text-gray-900 font-semibold underline underline-offset-4' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="py-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900">{activeEss.title}</h2>
                <div className="flex items-center gap-2">
                  <CourseToggle on={courseMode} onToggle={toggleCourse} />
                  <LevelToggle level={level} onChange={changeLevel} />
                </div>
              </div>
              <ExplanationCard explanation={ESS_EXPLANATIONS[essId]} level={level} />
              {activeEss.content}
            </div>
          </>
        ) : (
          <div className="py-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                {courseMode && chapterIndex >= 0 && (
                  <span className="text-gray-400 font-normal">Ch. {chapterIndex + 1} · </span>
                )}
                {MAIN_TABS.find(t => t.id === mainTab)?.label}
              </h2>
              <div className="flex items-center gap-2">
                <CourseToggle on={courseMode} onToggle={toggleCourse} />
                <LevelToggle level={level} onChange={changeLevel} />
              </div>
            </div>
            <ExplanationCard explanation={TAB_EXPLANATIONS[mainTab]} level={level} />
            {REVISION_CONTENT[mainTab]}
            {courseMode && chapterIndex >= 0 && (
              <CourseNav index={chapterIndex} completed={completed} onComplete={setChapter} goTo={goToChapter} />
            )}
          </div>
        )}
      </div>

      </LevelContext.Provider>
    </div>
    </MorphContentProvider>
  )
}
