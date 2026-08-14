import Link from 'next/link'
import { BookOpen, BookMarked, Table2, Scroll, ClipboardList, Bookmark, MessageSquare, FlaskConical } from 'lucide-react'
import { getServerTrack } from '@/lib/track-server'
import { getServerT } from '@/lib/i18n/server'

// Logged-out landing page, three cards: free study tools (no account), the $10/year
// student account, and the free (admin-approved) instructor account. All three "Create
// account" buttons hit the same sign-up form, where the role is chosen. Signed-in
// visitors never see this — src/app/page.tsx sends them straight to the Reader. Price is
// stated exactly as the Paddle checkout charges it.
export function LandingHero() {
  const t = getServerT()
  // The headline follows the language track — this is the first thing a visitor arriving
  // from seminaryhebrew.app reads, and "the Greek Bible" would be the wrong promise.
  const hebrew = getServerTrack() === 'hebrew'
  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {hebrew ? t('land.headlineHebrew') : t('land.headlineGreek')}
        </h1>
        <p className="text-gray-600 leading-relaxed">
          {t('land.subhead')}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
        {/* Free — no account needed */}
        <div className="rounded-xl border border-parchment-200 bg-surface p-6">
          <p className="font-semibold text-gray-900">{t('land.free')}</p>
          <p className="text-sm text-gray-400 mb-4">{t('land.noAccountNeeded')}</p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2.5"><BookOpen size={18} className="text-brand-600 shrink-0" /> {t('land.parsingReader')}</li>
            <li className="flex items-center gap-2.5"><BookMarked size={18} className="text-brand-600 shrink-0" /> {t('land.vocabDrills')}</li>
            <li className="flex items-center gap-2.5"><Table2 size={18} className="text-brand-600 shrink-0" /> {t('land.morphPractice')}</li>
            <li className="flex items-center gap-2.5"><Scroll size={18} className="text-brand-600 shrink-0" /> {t('land.exegesisWorkspace')}</li>
          </ul>
          <Link
            href="/reader"
            className="mt-6 block rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            {t('land.startFree')}
          </Link>
        </div>

        {/* Student account — $10/year */}
        <div className="rounded-xl border-2 border-brand-600 bg-surface p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">{t('land.studentAccount')}</p>
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">{t('land.pricePerYear')}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 mb-4">{t('land.priceNote')}</p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2.5"><ClipboardList size={18} className="text-brand-600 shrink-0" /> {t('land.courseAssignments')}</li>
            <li className="flex items-center gap-2.5"><Bookmark size={18} className="text-brand-600 shrink-0" /> {t('land.savedProgress')}</li>
            <li className="flex items-center gap-2.5"><MessageSquare size={18} className="text-brand-600 shrink-0" /> {t('land.classMessaging')}</li>
            <li className="flex items-center gap-2.5"><FlaskConical size={18} className="text-brand-600 shrink-0" /> {t('land.deepResearch')}</li>
          </ul>
          <Link
            href="/auth/sign-up/student"
            className="mt-6 block rounded-lg bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            {t('land.createAccount')}
          </Link>
          <p className="text-center text-xs text-gray-400 mt-2">{t('land.everythingInFree')}</p>
        </div>

        {/* Instructor account — free, admin-approved */}
        <div className="rounded-xl border border-parchment-200 bg-surface p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">{t('land.instructorAccount')}</p>
            <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">{t('land.free')}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 mb-4">{t('land.forInstructors')}</p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2.5"><ClipboardList size={18} className="text-brand-600 shrink-0" /> {t('land.createCourses')}</li>
            <li className="flex items-center gap-2.5"><Scroll size={18} className="text-brand-600 shrink-0" /> {t('land.buildExams')}</li>
            <li className="flex items-center gap-2.5"><Table2 size={18} className="text-brand-600 shrink-0" /> {t('land.trackProgress')}</li>
            <li className="flex items-center gap-2.5"><MessageSquare size={18} className="text-brand-600 shrink-0" /> {t('land.messageClasses')}</li>
          </ul>
          <Link
            href="/auth/sign-up/instructor"
            className="mt-6 block rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            {t('land.createAccount')}
          </Link>
          <p className="text-center text-xs text-gray-400 mt-2">{t('land.adminApproved')}</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        {t('land.alreadyHaveAccount')}{' '}
        <Link href="/auth/sign-in" className="text-brand-600 hover:underline font-medium">{t('account.signIn')}</Link>
        {' · '}
        <Link href="/pricing" className="text-brand-600 hover:underline">{t('land.viewPricing')}</Link>
      </p>
    </main>
  )
}
