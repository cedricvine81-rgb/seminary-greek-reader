import Link from 'next/link'
import { BookOpen, BookMarked, Table2, Scroll, ClipboardList, Bookmark, MessageSquare, FlaskConical } from 'lucide-react'

// Logged-out landing page, three cards: free study tools (no account), the $10/year
// student account, and the free (admin-approved) instructor account. All three "Create
// account" buttons hit the same sign-up form, where the role is chosen. Signed-in
// visitors never see this — src/app/page.tsx sends them straight to the Reader. Price is
// stated exactly as the Paddle checkout charges it.
export function LandingHero() {
  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Study the Greek Bible in the original</h1>
        <p className="text-gray-600 leading-relaxed">
          Start free with the study tools, or create an account for course material and deeper research.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
        {/* Free — no account needed */}
        <div className="rounded-xl border border-parchment-200 bg-white p-6">
          <p className="font-semibold text-gray-900">Free</p>
          <p className="text-sm text-gray-400 mb-4">No account needed</p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2.5"><BookOpen size={18} className="text-brand-600 shrink-0" /> Parsing reader</li>
            <li className="flex items-center gap-2.5"><BookMarked size={18} className="text-brand-600 shrink-0" /> Vocabulary drills</li>
            <li className="flex items-center gap-2.5"><Table2 size={18} className="text-brand-600 shrink-0" /> Morphology practice</li>
            <li className="flex items-center gap-2.5"><Scroll size={18} className="text-brand-600 shrink-0" /> Exegesis workspace</li>
          </ul>
          <Link
            href="/reader"
            className="mt-6 block rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Start free
          </Link>
        </div>

        {/* Student account — $10/year */}
        <div className="rounded-xl border-2 border-brand-600 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Student account</p>
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">$10 / year</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 mb-4">USD · taxes at checkout · cancel anytime</p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2.5"><ClipboardList size={18} className="text-brand-600 shrink-0" /> Course assignments and exams</li>
            <li className="flex items-center gap-2.5"><Bookmark size={18} className="text-brand-600 shrink-0" /> Saved progress and notes</li>
            <li className="flex items-center gap-2.5"><MessageSquare size={18} className="text-brand-600 shrink-0" /> Class messaging</li>
            <li className="flex items-center gap-2.5"><FlaskConical size={18} className="text-brand-600 shrink-0" /> Deep-research tools</li>
          </ul>
          <Link
            href="/auth/sign-up/student"
            className="mt-6 block rounded-lg bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Create account
          </Link>
          <p className="text-center text-xs text-gray-400 mt-2">Everything in Free, plus the above</p>
        </div>

        {/* Instructor account — free, admin-approved */}
        <div className="rounded-xl border border-parchment-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">Instructor account</p>
            <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">Free</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 mb-4">For instructors · no subscription</p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2.5"><ClipboardList size={18} className="text-brand-600 shrink-0" /> Create courses and assignments</li>
            <li className="flex items-center gap-2.5"><Scroll size={18} className="text-brand-600 shrink-0" /> Build Translation Exams</li>
            <li className="flex items-center gap-2.5"><Table2 size={18} className="text-brand-600 shrink-0" /> Track student progress</li>
            <li className="flex items-center gap-2.5"><MessageSquare size={18} className="text-brand-600 shrink-0" /> Message your classes</li>
          </ul>
          <Link
            href="/auth/sign-up/instructor"
            className="mt-6 block rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Create account
          </Link>
          <p className="text-center text-xs text-gray-400 mt-2">Approved by an admin before first sign-in</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="text-brand-600 hover:underline font-medium">Sign in</Link>
        {' · '}
        <Link href="/pricing" className="text-brand-600 hover:underline">View pricing</Link>
      </p>
    </main>
  )
}
