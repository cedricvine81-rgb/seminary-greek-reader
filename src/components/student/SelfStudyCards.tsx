'use client'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { SELF_STUDY_TRACKS, trackProgress } from '@/lib/self-study'

// The dashboard's Self-study section: the four instructor-free tracks with live progress.
// Complements courses — an enrolled student can use both; a student with no courses gets
// a way in that isn't "wait for an instructor".
export function SelfStudyCards({ heading = true }: {
  /** The dedicated /student/self-study page is already titled, so it turns the block's own
   *  heading off; on the dashboard it is one section among several and needs it. */
  heading?: boolean
} = {}) {
  const t = useT()
  const { completed } = useCourseProgress()
  return (
    <div className="space-y-3">
      {heading ? (
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <GraduationCap size={17} className="text-brand-600" /> {t('ss.title')}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t('ss.subtitle')}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('ss.subtitle')}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {SELF_STUDY_TRACKS.map(def => {
          const { done, total } = trackProgress(def, completed)
          const pct = total ? Math.round((done / total) * 100) : 0
          return (
            <Link
              key={def.id}
              href={`/student/self-study/${def.id}`}
              className="group rounded-xl border border-gray-200 bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
            >
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-800">{t(def.levelKey)}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{t(def.descKey)}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-gray-400">{pct}%</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
