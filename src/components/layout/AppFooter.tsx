import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export function AppFooter() {
  const t = getServerT()
  return (
    <footer className="border-t border-gray-100 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} Seminary Greek</p>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="hover:text-gray-600 hover:underline">{t('footer.pricing')}</Link>
          <Link href="/terms" className="hover:text-gray-600 hover:underline">{t('footer.terms')}</Link>
          <Link href="/privacy" className="hover:text-gray-600 hover:underline">{t('footer.privacy')}</Link>
          <Link href="/refunds" className="hover:text-gray-600 hover:underline">{t('footer.refunds')}</Link>
        </nav>
      </div>
    </footer>
  )
}
