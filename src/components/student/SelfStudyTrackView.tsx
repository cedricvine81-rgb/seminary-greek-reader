'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, BookOpen, BookMarked, Check, Award } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { selfStudyTrack, trackProgress, type SelfStudyLesson, type SelfStudyStep } from '@/lib/self-study'
import { SelfStudyPanel } from './SelfStudyPanel'
import type { VocabLang } from '@/components/vocab/VocabBuilder'
// Type-only: erased at build time, so these do NOT pull the grammar views into this bundle.
import type { MainTab } from '@/components/vocab/MorphologyView'
import type { MorphLevel } from '@/components/morphology/shared'

// One self-study track: its numbered lessons, each step a link into the material plus a
// self-marked completion toggle. Progress is the shared morphology-progress store
// (localStorage + account when signed in), so Greek Beginning's grammar ticks are the
// same ticks as the Grammar page's course mode.
//
// EVERY step opens in a RIGHT-HAND PANEL over this page rather than navigating away — losing
// the plan behind a full-page session was the complaint, and it applied to a grammar chapter
// as much as to a vocabulary drill. (This comment used to say grammar chapters still navigate;
// they have not since the embedded grammar views were wired in below.)
// The step href stays real, so middle-click/new-tab and the panel's open-full-page
// button keep working. The heavy panel bodies (the vocab builder pulls the whole deck)
// load on demand via dynamic imports — nothing lands in this page's bundle until opened.

const VocabBuilder = dynamic(
  () => import('@/components/vocab/VocabBuilder').then(m => m.VocabBuilder),
  { ssr: false, loading: () => <PanelLoading /> },
)
const PracticeVocabQuiz = dynamic(
  () => import('./PracticeVocabQuiz').then(m => m.PracticeVocabQuiz),
  { ssr: false, loading: () => <PanelLoading /> },
)
const PracticeMorphQuiz = dynamic(
  () => import('./PracticeMorphQuiz').then(m => m.PracticeMorphQuiz),
  { ssr: false, loading: () => <PanelLoading /> },
)
// The grammar chapters themselves — the same embedded views the Reader's Grammar panel
// uses, so a READ step opens beside the plan instead of navigating away from it.
const MorphologyView = dynamic(
  () => import('@/components/vocab/MorphologyView').then(m => m.MorphologyView),
  { ssr: false, loading: () => <PanelLoading /> },
)
const HebrewGrammarView = dynamic(
  () => import('@/components/morphology/hebrew/HebrewGrammarView').then(m => m.HebrewGrammarView),
  { ssr: false, loading: () => <PanelLoading /> },
)

/** A grammar step's href carries everything the embedded view needs. The chapter ids in
 *  the registry ARE the view's tab ids (that is what makes the ticks shared), so the cast
 *  is a restatement of a fact the registry already guarantees. */
function grammarTarget(href: string): { chapter: MainTab; level: MorphLevel } {
  const q = new URLSearchParams(href.split('?')[1] ?? '')
  return {
    chapter: (q.get('chapter') ?? 'essentials') as MainTab,
    level: q.get('level') === 'intermediate' ? 'intermediate' : 'beginning',
  }
}

/**
 * A step's display name. Vocabulary set labels are composed sentences ("BGVB 3 · Section I-C
 * (41–60)"), so they carry a key AND its holes rather than a pre-built string — the word
 * "Section" has to be able to become "Sección", and the order of the pieces has to be the
 * catalogue's business, not this file's. `label` remains for the labels with nothing
 * translatable in them (an author's name plus a band code).
 */
function stepLabel(step: SelfStudyStep, t: (k: string, vars?: Record<string, string | number>) => string) {
  return step.labelKey ? t(step.labelKey, step.labelVars) : step.label
}

function PanelLoading() {
  const t = useT()
  return <p className="py-8 text-sm italic text-gray-400">{t('hw.loading')}</p>
}

export function SelfStudyTrackView({ trackId }: { trackId: string }) {
  const t = useT()
  const def = selfStudyTrack(trackId)
  const { completed, setChapter } = useCourseProgress()
  const listRef = useRef<HTMLOListElement>(null)
  // The panel owns its own Escape handling, resize and page-squeeze (SelfStudyPanel).
  const [panel, setPanel] = useState<SelfStudyStep | null>(null)

  if (!def) return null
  const { done, total } = trackProgress(def, completed)
  const lessonDone = (l: SelfStudyLesson) => l.steps.every(s => completed.has(s.key))
  const firstOpen = def.lessons.findIndex(l => !lessonDone(l))
  const vocabLang: VocabLang = def.hebrew ? 'hebrew' : 'greek'

  function continueTo() {
    const el = listRef.current?.children[Math.max(0, firstOpen)]
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/student" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <ArrowLeft size={14} /> {t('course.backToDashboard')}
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{t(def.levelKey)}</h1>
        <p className="mt-1 text-sm text-gray-500">{t(def.descKey)}</p>
      </div>

      {/* Progress + continue */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-surface px-4 py-3">
        <div className="min-w-[10rem] flex-1">
          <p className="text-sm font-medium text-gray-800">{t('ss.progress', { done, total })}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
        {firstOpen >= 0 ? (
          <button onClick={continueTo} className="shrink-0 rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            {done > 0 ? t('ss.continue') : t('ss.start')} <ArrowRight size={14} className="ml-0.5 inline" />
          </button>
        ) : (
          <span className="text-sm font-medium text-green-600">{t('ss.allDone')}</span>
        )}
      </div>

      <ol ref={listRef} className="space-y-3">
        {def.lessons.map((lesson, i) => {
          const doneLesson = lessonDone(lesson)
          return (
            <li key={i} className={clsx('rounded-xl border p-4', doneLesson ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-surface')}>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span className={clsx(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold',
                  doneLesson ? 'bg-green-600 text-white' : 'bg-brand-600 text-white',
                )}>
                  {doneLesson ? <Check size={12} /> : i + 1}
                </span>
                <span className={doneLesson ? 'text-green-700' : 'text-gray-500'}>{t('ss.lessonN', { n: i + 1 })}</span>
              </p>
              <ul className="space-y-1.5">
                {lesson.steps.map(step => {
                  const stepDone = completed.has(step.key)
                  const isQuiz = step.kind === 'quiz'
                  // Every step opens in the side panel — reading a chapter used to replace
                  // the plan, exactly like the vocabulary sessions did.
                  const inPanel = true
                  return (
                    <li key={step.key} className="flex items-center gap-2.5">
                      {/* Quiz steps are completed by PASSING the quiz — no manual toggle. */}
                      <button
                        type="button"
                        onClick={isQuiz ? undefined : () => setChapter(step.key, !stepDone)}
                        disabled={isQuiz}
                        title={isQuiz ? t('ss.quizAuto') : stepDone ? t('ss.markUndone') : t('ss.markDone')}
                        aria-pressed={stepDone}
                        className={clsx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          stepDone ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 text-transparent',
                          !isQuiz && !stepDone && 'hover:border-brand-400',
                          isQuiz && !stepDone && 'border-dashed cursor-default',
                        )}
                      >
                        <Check size={12} />
                      </button>
                      {/* The KIND CHIP IS PART OF THE LINK. It used to be a bare span beside it,
                          so the row read as one control and behaved as two: clicking READ — the
                          obvious target, and the widest — did nothing at all, and only the title
                          text opened the chapter. The chapter has always opened in the side
                          panel; for anyone who aimed at the chip, it appeared not to. */}
                      <Link
                        href={step.href}
                        onClick={inPanel ? e => { e.preventDefault(); setPanel(step) } : undefined}
                        className="group flex min-w-0 flex-1 items-center gap-2.5"
                      >
                        <span className={clsx(
                          'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          step.kind === 'grammar' ? 'bg-brand-50 text-brand-700' : isQuiz ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700',
                        )}>
                          {step.kind === 'grammar' ? <BookOpen size={10} /> : isQuiz ? <Award size={10} /> : <BookMarked size={10} />}
                          {step.kind === 'grammar' ? t('ss.read') : isQuiz ? t('ss.quiz') : t('ss.vocab')}
                        </span>
                        <span className={clsx('min-w-0 flex-1 truncate text-sm group-hover:text-brand-700 group-hover:underline', stepDone ? 'text-gray-400 line-through' : 'text-gray-800')}>
                          {stepLabel(step, t)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>

      {/* Right-hand dock: vocab / quizzes open BESIDE the plan (the page is squeezed, not
          covered) exactly as the search and Grammar panes do elsewhere in the app. */}
      {panel && (
        <SelfStudyPanel
          // Keyed by step so opening a DIFFERENT step in an already-open panel gets a fresh
          // view. Chapter and lesson are seeded into useState, which only runs on mount, so
          // without this React reuses the instance and keeps the previous chapter: the
          // header said "Nouns/Adj." while the body still showed "Ch. 5 · Pronouns". It
          // also resets a half-finished quiz and the scroll position, which is what
          // "open this step" should mean.
          key={panel.key}
          title={stepLabel(panel, t) ?? ''}
          subtitle={panel.lesson != null ? t('ss.lessonN', { n: panel.lesson }) : undefined}
          fullHref={panel.href}
          fullLabel={t('ss.fullPage')}
          closeLabel={t('action.close')}
          resizeLabel={t('ss.resizePanel')}
          onClose={() => setPanel(null)}
        >
          {panel.kind === 'grammar' ? (
            def.hebrew
              ? <HebrewGrammarView embedded initialChapter={grammarTarget(panel.href).chapter} />
              : <MorphologyView
                  embedded
                  initialChapter={grammarTarget(panel.href).chapter}
                  initialLevel={grammarTarget(panel.href).level}
                />
          ) : panel.morph && panel.lesson != null ? (
            <PracticeMorphQuiz trackId={def.id} lessonNo={panel.lesson} embedded />
          ) : panel.quiz && panel.lesson != null ? (
            <PracticeVocabQuiz trackId={def.id} lessonNo={panel.lesson} embedded />
          ) : (
            <VocabBuilder lang={vocabLang} />
          )}
        </SelfStudyPanel>
      )}
    </div>
  )
}
