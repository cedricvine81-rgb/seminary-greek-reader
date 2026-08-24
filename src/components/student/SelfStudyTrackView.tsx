'use client'
import { useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, BookOpen, BookMarked, Check } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { selfStudyTrack, trackProgress, type SelfStudyLesson } from '@/lib/self-study'

// One self-study track: its numbered lessons, each step a link into the material plus a
// self-marked completion toggle. Progress is the shared morphology-progress store
// (localStorage + account when signed in), so Greek Beginning's grammar ticks are the
// same ticks as the Grammar page's course mode.
export function SelfStudyTrackView({ trackId }: { trackId: string }) {
  const t = useT()
  const def = selfStudyTrack(trackId)
  const { completed, setChapter } = useCourseProgress()
  const listRef = useRef<HTMLOListElement>(null)

  if (!def) return null
  const { done, total } = trackProgress(def, completed)
  const lessonDone = (l: SelfStudyLesson) => l.steps.every(s => completed.has(s.key))
  const firstOpen = def.lessons.findIndex(l => !lessonDone(l))

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
                  return (
                    <li key={step.key} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setChapter(step.key, !stepDone)}
                        title={stepDone ? t('ss.markUndone') : t('ss.markDone')}
                        aria-pressed={stepDone}
                        className={clsx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          stepDone ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 text-transparent hover:border-brand-400',
                        )}
                      >
                        <Check size={12} />
                      </button>
                      <span className={clsx(
                        'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        step.kind === 'grammar' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700',
                      )}>
                        {step.kind === 'grammar' ? <BookOpen size={10} /> : <BookMarked size={10} />}
                        {step.kind === 'grammar' ? t('ss.read') : t('ss.vocab')}
                      </span>
                      <Link
                        href={step.href}
                        className={clsx('min-w-0 flex-1 truncate text-sm hover:text-brand-700 hover:underline', stepDone ? 'text-gray-400 line-through' : 'text-gray-800')}
                      >
                        {step.labelKey ? t(step.labelKey) : step.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
