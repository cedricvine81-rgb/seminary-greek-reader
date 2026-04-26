import type { Metadata } from 'next'
import { GreekReader } from '@/components/reader/GreekReader'

export const metadata: Metadata = { title: 'Greek Text Reader' }

export default function ReaderPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Greek Text Reader</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Read the Septuagint (LXX) and Greek New Testament. Hover any word to see parsing information.
        </p>
      </div>
      <GreekReader />
    </main>
  )
}
