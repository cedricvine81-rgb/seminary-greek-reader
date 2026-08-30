import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BACKGROUND, BACKGROUND_LEDE } from '@/lib/register-background'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { loadContent } from '@/lib/i18n/content-load'
import { content } from '@/lib/i18n/content'

export const metadata: Metadata = { title: 'Register — the background' }

// The scholarly note behind the Register tool. A page of its own rather than a panel: it is an
// argument to be read once and possibly cited, not instructions to be followed while working.
// Rendered on the server so the translation is chosen there — an English reader is handed the
// empty catalogue and downloads nothing.
export default async function RegisterBackgroundPage() {
  const t = getServerT()
  const cat = await loadContent(getServerLocale(), 'registerBackground')
  const say = (key: string, english: string) => content(cat, key, english)

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/tools/register"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline">
        <ArrowLeft size={14} /> {t('reg.backToTool')}
      </Link>

      <h1 className="text-lg font-semibold text-gray-800">{t('reg.bg.title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">
        {say('regbg.lede', BACKGROUND_LEDE)}
      </p>

      {BACKGROUND.map(sec => (
        <section key={sec.id} className="mt-7">
          <h2 className="text-base font-semibold text-gray-900">
            {say(`regbg.${sec.id}.h`, sec.heading)}
          </h2>
          {sec.paragraphs.map((p, i) => (
            <p key={i} className="mt-2.5 text-sm leading-relaxed text-gray-700">
              {say(`regbg.${sec.id}.p${i}`, p)}
            </p>
          ))}
          {sec.reading && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3.5 py-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {t('reg.bg.reading')}
              </p>
              <ul className="space-y-0.5 text-xs text-gray-600">
                {sec.reading.map(r => <li key={r}>{r}</li>)}
              </ul>
            </div>
          )}
        </section>
      ))}

      <p className="mt-8 border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500">
        {t('reg.bg.footer')}
      </p>
    </main>
  )
}
