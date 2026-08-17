import Link from 'next/link'
import Image from 'next/image'
import { AccountMenu } from './AccountMenu'
import { MasterSearchButton } from '@/components/search/MasterSearchButton'
import { PageGuideButton } from '@/components/help/PageGuideButton'
import { LanguageMenu } from '@/components/layout/LanguageMenu'
import { ToolsNavMenu } from '@/components/layout/ToolsNavMenu'
import { TextsNavMenu } from './TextsNavMenu'
import { BookOpen, BookMarked, Table2, Scroll, StickyNote, LayoutDashboard } from 'lucide-react'
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

        {/* Center nav — DESKTOP ONLY. Below lg the same six sections are in the ☰ menu, and
            showing both put every option on screen twice on an iPad. One navigation surface
            per width: the menu below lg, this row above it.
            min-w-0 + overflow-x-auto stays as the backstop — whatever ends up in here, the
            row scrolls rather than shoving the controls after it off the viewport, which is
            how the menu button came to be 13px off the edge of a phone. */}
        <nav className="hidden min-w-0 items-center gap-0.5 overflow-x-auto lg:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/reader" title={t('nav.reader')} className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookOpen size={18} /> <span className="hidden xl:inline">{t('nav.reader')}</span>
          </Link>
          <Link href="/vocab" title={t('nav.vocab')} className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookMarked size={18} /> <span className="hidden xl:inline">{t('nav.vocab')}</span>
          </Link>
          <Link href="/grammar" title={t('nav.grammar')} className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Table2 size={18} /> <span className="hidden xl:inline">{t('nav.grammar')}</span>
          </Link>
          <Link href="/exegesis" title={t('nav.exegesis')} className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Scroll size={18} /> <span className="hidden xl:inline">{t('nav.exegesis')}</span>
          </Link>
          {/* Notes is a tab inside Exegesis, but it is somewhere a reader goes deliberately
              rather than a step in exegesis, so it gets its own way in. */}
          <Link href="/notes" title={t('tab.notes')} className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <StickyNote size={18} /> <span className="hidden xl:inline">{t('tab.notes')}</span>
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
              title={t('nav.dashboard')}
              className="px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard size={18} /> <span className="hidden xl:inline">{t('nav.dashboard')}</span>
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
