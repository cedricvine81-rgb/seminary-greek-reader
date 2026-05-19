import type { Metadata } from 'next'
import { GreekReader } from '@/components/reader/GreekReader'

export const metadata: Metadata = { title: 'Greek Text Reader' }

export default function HomePage() {
  return (
    <div
      className="flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-1 pb-4 max-w-5xl mx-auto w-full"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    >
      <GreekReader />
    </div>
  )
}
