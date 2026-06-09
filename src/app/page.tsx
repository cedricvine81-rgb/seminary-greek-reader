import type { Metadata } from 'next'
import Link from 'next/link'
import { GreekReader } from '@/components/reader/GreekReader'

export const metadata: Metadata = { title: 'Greek Text Reader' }

export default function HomePage() {
  return (
    <div
      className="flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-1 pb-4 max-w-5xl mx-auto w-full"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    >
      {/* Exegesis Workspace banner */}
      <div className="shrink-0 mb-2">
        <Link
          href="/student/exegesis"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition group"
        >
          <span className="text-2xl">📜</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-800 group-hover:text-indigo-900">
              Exegesis Workspace
            </p>
            <p className="text-xs text-indigo-600 truncate">
              Select a passage · click each word · annotate Parsing, Syntax &amp; Translation · export PDF
            </p>
          </div>
          <span className="text-indigo-400 group-hover:text-indigo-600 text-lg">→</span>
        </Link>
      </div>

      <GreekReader />
    </div>
  )
}
