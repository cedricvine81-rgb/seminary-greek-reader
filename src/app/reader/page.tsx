import type { Metadata } from 'next'
import { GreekReader } from '@/components/reader/GreekReader'

export const metadata: Metadata = { title: 'Greek Text Reader' }

export default function ReaderPage({ searchParams }: { searchParams: { ref?: string } }) {
  return (
    <div
      className="reader-container-h flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pt-4 pb-4 max-w-5xl mx-auto w-full"
    >
      <GreekReader initialRef={searchParams?.ref} />
    </div>
  )
}
