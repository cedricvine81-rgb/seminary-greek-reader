import type { Metadata } from 'next'
import { RegisterView } from '@/components/tools/RegisterView'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Register' }

// Which works in the library write Greek like this one? Profiles are built by
// scripts/build-style-index.ts from the construct-search indexes — 433 works, 5.75M words —
// and served as static JSON; the arithmetic runs in the browser.
//
// The name is deliberate: REGISTER, the level and texture of the Greek, is what this measures.
// It is not authorship, and the page says so above the results — Hebrews ranks first to Romans
// on function words, which is genre, not Paul.
export default function RegisterPage() {
  const t = getServerT()
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 print:hidden">
        <h1 className="text-lg font-semibold text-gray-800">{t('reg.title')}</h1>
      </div>
      <RegisterView />
    </main>
  )
}
