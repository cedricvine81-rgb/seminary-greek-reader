import Link from 'next/link'
import Image from 'next/image'
import { AccountMenu } from './AccountMenu'
import { MasterSearchButton } from '@/components/search/MasterSearchButton'
import { PageGuideButton } from '@/components/help/PageGuideButton'
import { TextsNavMenu } from './TextsNavMenu'
import { BookOpen, BookMarked, Table2, Scroll, LayoutDashboard } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'

interface AppHeaderProps {
  isAuthenticated?: boolean
  userRole?: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  userName?: string
}

// The `.app-header` class hooks the mobile auto-hide behavior in globals.css;
// the reader toggles html[data-immersive] as the user scrolls. See GreekReader.
export function AppHeader({ isAuthenticated = false, userRole, userName }: AppHeaderProps) {
  const t = getServerT()
  // Brand/logo sends signed-in users to their dashboard, not the Reader at "/".
  const brandHref = isAuthenticated
    ? userRole === 'INSTRUCTOR' ? '/instructor'
      : userRole === 'STUDENT' ? '/student'
      : userRole === 'ADMIN' ? '/admin'
      : '/'
    : '/'
  return (
    <header className="app-header sticky top-0 z-40 bg-topbar/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href={brandHref} className="flex items-center gap-2.5 group">
          <div className="w-10 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-parchment-100 font-serif text-base font-bold tracking-tight">ΣΓ</span>
          </div>
          <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors hidden sm:block">
            Seminary Greek
          </span>
        </Link>

        {/* Center nav — icons only on mobile, icons + text on md+ */}
        <nav className="flex items-center gap-0.5">
          <Link href="/reader" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookOpen size={18} /> <span className="hidden md:inline">{t('nav.reader')}</span>
          </Link>
          <Link href="/vocab" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookMarked size={18} /> <span className="hidden md:inline">{t('nav.vocab')}</span>
          </Link>
          <Link href="/grammar" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Table2 size={18} /> <span className="hidden md:inline">{t('nav.grammar')}</span>
          </Link>
          <Link href="/exegesis" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Scroll size={18} /> <span className="hidden md:inline">{t('nav.exegesis')}</span>
          </Link>
          <TextsNavMenu />
          {isAuthenticated && (userRole === 'INSTRUCTOR' || userRole === 'STUDENT' || userRole === 'ADMIN') && (
            <Link
              href={userRole === 'INSTRUCTOR' ? '/instructor' : userRole === 'ADMIN' ? '/admin' : '/student'}
              className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard size={18} /> <span className="hidden md:inline">{t('nav.dashboard')}</span>
            </Link>
          )}
        </nav>

        {/* Right: page guide + search icon (desktop) + hamburger menu */}
        <div className="flex items-center gap-1">
          <PageGuideButton />
          <MasterSearchButton />
          <AccountMenu isAuthenticated={isAuthenticated} userRole={userRole} userName={userName} />
        </div>
      </div>
    </header>
  )
}
