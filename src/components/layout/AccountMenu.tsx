'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Menu, X, LogIn, UserPlus, LogOut, Settings, Search,
  LayoutDashboard, Calendar, ClipboardList, FileText,
  BarChart2, GraduationCap, TrendingUp,
  BookMarked, Archive, Mail, Users,
} from 'lucide-react'
import { openMasterSearch } from '@/lib/master-search-bus'
import { PageGuideMenuItem } from '@/components/help/PageGuideButton'
import { useT } from '@/lib/i18n/LocaleProvider'

interface AppMenuProps {
  isAuthenticated: boolean
  userRole?: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  userName?: string
}

// `label` is an i18n key, not display text — resolved with t() at render.
const INSTRUCTOR_NAV = [
  { href: '/instructor',            label: 'nav.dashboard',    icon: LayoutDashboard },
  { href: '/instructor/assignments',label: 'nav.assignments',  icon: ClipboardList },
  { href: '/instructor/materials',  label: 'nav.materials',    icon: FileText },
  { href: '/instructor/reports',    label: 'nav.reports',      icon: BarChart2 },
  { href: '/instructor/archive',    label: 'nav.archive',      icon: Archive },
]

const STUDENT_NAV = [
  { href: '/student',               label: 'nav.dashboard',    icon: LayoutDashboard },
  { href: '/student/calendar',      label: 'nav.calendar',     icon: Calendar },
  { href: '/student/assignments',   label: 'nav.assignments',  icon: ClipboardList },
  { href: '/student/group-presentations', label: 'nav.groupWork', icon: Users },
  { href: '/student/messages',      label: 'nav.messages',     icon: Mail },
  { href: '/student/progress',      label: 'nav.accuracy',     icon: TrendingUp },
  { href: '/student/scores',        label: 'nav.grades',       icon: BarChart2 },
  { href: '/student/materials',     label: 'nav.materials',    icon: BookMarked },
]

export function AccountMenu({ isAuthenticated, userRole, userName }: AppMenuProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleSignOut() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/')
    router.refresh()
    setOpen(false)
  }

  const nav = userRole === 'INSTRUCTOR' ? INSTRUCTOR_NAV
    : userRole === 'STUDENT' ? STUDENT_NAV
    : userRole === 'ADMIN' ? [{ href: '/admin', label: 'nav.dashboard', icon: LayoutDashboard }]
    : []

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {isAuthenticated && userName && (
        <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName.split(' ')[0]}</span>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label={t('account.openMenu')}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 bg-popover rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-[80vh] overflow-y-auto">
          {/* Search — shown wherever the sidebar is not (it appears at lg and up). This was
              md:hidden, which hid it from 768px: on an iPad the sidebar had not appeared yet,
              so search was missing from both surfaces at once. */}
          <button
            onClick={() => { setOpen(false); openMasterSearch() }}
            className="lg:hidden flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <Search size={15} className="text-gray-400 shrink-0" /> {t('account.search')}
          </button>
          {/* "About this page" — the header's ? button is desktop-only, same as search above.
              PageGuideMenuItem hides itself on pages that have no guide. */}
          <PageGuideMenuItem onNavigate={() => setOpen(false)} />
          {isAuthenticated ? (
            <>
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs text-gray-400">{t('account.signedInAs')}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-brand-600 capitalize">{userRole?.toLowerCase()}</p>
              </div>

              {/* Navigation — mobile only. On desktop the left sidebar already
                  provides full navigation, so the dropdown stays account-focused
                  (avoids duplicating the sidebar). */}
              {nav.length > 0 && (
                <div className="lg:hidden">
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('nav.navigation')}</p>
                  </div>
                  {nav.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={15} className="text-gray-400 shrink-0" />
                      {t(label)}
                    </Link>
                  ))}
                  <hr className="my-1 border-gray-100" />
                </div>
              )}

              {/* Settings + sign out */}
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Settings size={15} className="text-gray-400 shrink-0" />
                {t('account.settings')}
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="shrink-0" />
                {t('account.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <LogIn size={15} /> {t('account.signIn')}
              </Link>
              <Link
                href="/auth/sign-up"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <UserPlus size={15} /> {t('account.signUp')}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
