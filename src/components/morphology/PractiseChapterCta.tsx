'use client'
import Link from 'next/link'
import { Dumbbell } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { practiceForChapter, practiceHref } from '@/lib/morph-practice-links'
import type { MorphLang } from '@/lib/morph-grammar-links'
import { useSignedIn } from './session-probe'

// "Follow my lesson": the drill for the chapter the student has just read, offered at the foot
// of the chapter — where a student who has finished reading actually is. The forms are
// generated fresh, nothing is recorded, and the session ends in the same report of what to
// work on that the assignment and self-study drills give.
//
// Hidden for chapters with no distinct forms to drill (pronunciation, prepositions, syntax…)
// and for signed-out visitors: the Grammar is public but the drills are not, so an anonymous
// reader would only be offered a sign-in wall.
export function PractiseChapterCta({ lang, chapterId, level }: {
  lang: MorphLang
  chapterId: string
  /** Greek only — carried into the back link so the chapter reopens at the level being read. */
  level?: 'beginning' | 'intermediate'
}) {
  const t = useT()
  const signedIn = useSignedIn()
  const practice = practiceForChapter(lang, chapterId)
  if (!practice || !signedIn) return null

  const back = `/grammar?chapter=${chapterId}`
    + (lang === 'greek' ? `&level=${level ?? 'beginning'}&track=greek` : '&track=hebrew')
  const href = practiceHref(lang, chapterId, back)
  if (!href) return null

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-900">{t('morph.practiseTitle')}</p>
        <p className="text-sm text-brand-800">{t('morph.practiseBody', { quiz: t(practice.def.labelKey) })}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Link
          href={href}
          className="btn btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm"
        >
          <Dumbbell size={15} /> {t('morph.practiseCta')}
        </Link>
        {/* The chapter's drill is the common case; the builder is for the student who wants
            something narrower ("only aorist passives") or wider than one chapter. */}
        <Link href="/student/practice/morphology" className="text-xs font-medium text-brand-700 hover:text-brand-900">
          {t('pr.b.buildYourOwn')} →
        </Link>
      </div>
    </div>
  )
}
