import Link from 'next/link'
import Image from 'next/image'
import { AccountMenu } from './AccountMenu'
import { MasterSearchButton } from '@/components/search/MasterSearchButton'
import { PageGuideButton } from '@/components/help/PageGuideButton'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ToolsNavMenu } from '@/components/layout/ToolsNavMenu'
import { TextsNavMenu } from './TextsNavMenu'
import { BookOpen, BookMarked, Table2, Scroll, LayoutDashboard } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'
import { getServerBrand } from '@/lib/track-server'
import { TrackToggle } from './TrackToggle'

interface AppHeaderProps {
  isAuthenticated?: boolean
  userRole?: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  userName?: string
}

// The `.app-header` class hooks the mobile auto-hide behavior in globals.css;
// the reader toggles html[data-immersive] as the user scrolls. See GreekReader.
export function AppHeader({ isAuthenticated = false, userRole, userName }: AppHeaderProps) {
  const t = getServerT()
  // Which brand this render wears — Seminary Greek or Seminary Hebrew. Read from the track
  // cookie on the server so the name is right on the first paint. See src/lib/track.ts.
  const brand = getServerBrand()
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
        {/* Brand. The mark IS the track switch — two joined monograms, the active one
            carrying the brand blue the logo has always worn. Clicking it rewrites the
            wordmark beside it in place.

            The mark cannot sit inside the Link (a button in an anchor is invalid HTML and
            would navigate as well as switch), so the wordmark alone carries the link to
            the dashboard. */}
        <div className="flex items-center gap-2.5 shrink-0">
          <TrackToggle />
          <Link
            href={brandHref}
            className="font-semibold text-gray-900 hover:text-brand-700 transition-colors hidden sm:block whitespace-nowrap"
          >
            {brand.name}
          </Link>
        </div>

        {/* Center nav — icons only until lg, icons + text above it.
            The labels used to appear at `md`, which is 768px, which is an iPad in portrait:
            the row grew to 966px and pushed the language switcher and the menu button clean
            off the screen. They now wait for lg, where there is room.
            min-w-0 + overflow-x-auto is the belt to that braces: whatever ends up in here,
            the row scrolls rather than shoving the controls after it out of the viewport. */}
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/reader" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookOpen size={18} /> <span className="hidden lg:inline">{t('nav.reader')}</span>
          </Link>
          <Link href="/vocab" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookMarked size={18} /> <span className="hidden lg:inline">{t('nav.vocab')}</span>
          </Link>
          <Link href="/grammar" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Table2 size={18} /> <span className="hidden lg:inline">{t('nav.grammar')}</span>
          </Link>
          <Link href="/exegesis" className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Scroll size={18} /> <span className="hidden lg:inline">{t('nav.exegesis')}</span>
          </Link>
          <TextsNavMenu />
          {/* Between Texts and Dashboard: everything behind it works ON the Texts corpora, so it
              belongs beside them rather than with the course-admin links. A hover menu like the
              Texts one, for consistency — and because the map and construct search had no route
              into them from the header at all and went largely unused as a result. */}
          <ToolsNavMenu />
          {isAuthenticated && (userRole === 'INSTRUCTOR' || userRole === 'STUDENT' || userRole === 'ADMIN') && (
            <Link
              href={userRole === 'INSTRUCTOR' ? '/instructor' : userRole === 'ADMIN' ? '/admin' : '/student'}
              className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard size={18} /> <span className="hidden lg:inline">{t('nav.dashboard')}</span>
            </Link>
          )}
        </nav>

        {/* Right: page guide + search icon (desktop) + hamburger menu */}
        <div className="flex items-center gap-1">
          <PageGuideButton />
          <MasterSearchButton />
          <LanguageMenu />
          <AccountMenu isAuthenticated={isAuthenticated} userRole={userRole} userName={userName} />
        </div>
      </div>
    </header>
  )
}
