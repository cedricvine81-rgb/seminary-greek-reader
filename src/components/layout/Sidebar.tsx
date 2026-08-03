'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useApi } from '@/lib/api-client'
import {
  LayoutDashboard, BookMarked, Calendar, Archive,
  ClipboardList, BarChart2, FileText,
  Settings, Bell,
  Users, BookOpen, Building2, Mail, ShieldAlert, Gavel,
} from 'lucide-react'

interface NavItem {
  /** i18n key, not display text — resolved with t() where the item is rendered. */
  label: string
  href: string
  icon: React.ReactNode
}

const instructorNav: NavItem[] = [
  { label: 'nav.dashboard',   href: '/instructor',               icon: <LayoutDashboard size={16} /> },
  { label: 'nav.requests',    href: '/instructor/requests',      icon: <Bell size={16} /> },
  { label: 'nav.messages',    href: '/instructor/messages',      icon: <Mail size={16} /> },
  { label: 'nav.assignments', href: '/instructor/assignments',   icon: <ClipboardList size={16} /> },
  { label: 'nav.appeals',     href: '/instructor/appeals',       icon: <Gavel size={16} /> },
  { label: 'nav.materials',   href: '/instructor/materials',     icon: <FileText size={16} /> },
  { label: 'nav.reports',     href: '/instructor/reports',       icon: <BarChart2 size={16} /> },
  { label: 'nav.archive',     href: '/instructor/archive',       icon: <Archive size={16} /> },
]

const adminNav: NavItem[] = [
  { label: 'nav.dashboard',     href: '/admin',                    icon: <LayoutDashboard size={16} /> },
  { label: 'nav.users',         href: '/admin/users',              icon: <Users size={16} /> },
  { label: 'nav.courses',       href: '/admin/courses',            icon: <BookOpen size={16} /> },
  { label: 'nav.institutions',  href: '/admin/institutions',       icon: <Building2 size={16} /> },
  { label: 'nav.vocabSynonyms',href: '/admin/vocab/synonyms',     icon: <BookMarked size={16} /> },
  { label: 'nav.vocabAppeals', href: '/admin/appeals',            icon: <Gavel size={16} /> },
  { label: 'nav.auditLog',     href: '/admin/audit',              icon: <ShieldAlert size={16} /> },
  { label: 'nav.notifications', href: '/admin/settings',           icon: <Settings size={16} /> },
]

const studentNav: NavItem[] = [
  { label: 'nav.dashboard',   href: '/student',                  icon: <LayoutDashboard size={16} /> },
  { label: 'nav.calendar',    href: '/student/calendar',         icon: <Calendar size={16} /> },
  { label: 'nav.assignments', href: '/student/assignments',      icon: <ClipboardList size={16} /> },
  { label: 'nav.messages',    href: '/student/messages',         icon: <Mail size={16} /> },
  { label: 'nav.materials',   href: '/student/materials',        icon: <BookMarked size={16} /> },
]

interface SidebarProps {
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  pendingRequests?: number
}

export function Sidebar({ role, pendingRequests = 0 }: SidebarProps) {
  const t = useT()
  const pathname = usePathname()
  const items = role === 'INSTRUCTOR' ? instructorNav : role === 'ADMIN' ? adminNav : studentNav

  // Unread message count for the nav badge (students + instructors), revalidates on focus
  const { data: unreadData } = useApi<{ count: number }>(
    role === 'ADMIN' ? null : '/api/messages/unread',
    { refreshInterval: 60_000 },
  )
  const unreadMessages = unreadData?.count ?? 0

  // Pending appeals count for instructors
  const { data: appealsData } = useApi<{ count: number }>(
    role === 'INSTRUCTOR' ? '/api/instructor/appeals/pending' : null,
    { refreshInterval: 60_000 },
  )
  const pendingAppeals = appealsData?.count ?? 0

  // Pending enrollment-request count for instructors — polled live (like messages/appeals)
  // so new requests flag up without a full reload. The server-passed `pendingRequests`
  // seeds the first render; once SWR has data it takes over.
  const { data: requestsData } = useApi<{ pending: unknown[] }>(
    role === 'INSTRUCTOR' ? '/api/enrollments/pending' : null,
    { refreshInterval: 60_000 },
  )
  const liveRequests = requestsData ? requestsData.pending.length : pendingRequests

  // Pending admin-tier appeals count for admins
  const { data: adminAppealsData } = useApi<{ count: number }>(
    role === 'ADMIN' ? '/api/admin/appeals/pending' : null,
    { refreshInterval: 60_000 },
  )
  const pendingAdminAppeals = adminAppealsData?.count ?? 0

  const settingsActive = pathname === '/settings'

  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col bg-surface border-r border-gray-100 min-h-screen pt-6">
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/instructor' && item.href !== '/student' && item.href !== '/admin' && pathname.startsWith(item.href))
          const isRequests = item.href === '/instructor/requests'
          const isMessages = item.href === '/student/messages' || item.href === '/instructor/messages'
          const isAppeals = item.href === '/instructor/appeals'
          const isAdminAppeals = item.href === '/admin/appeals'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {item.icon}
              <span className="flex-1">{t(item.label)}</span>
              {isRequests && liveRequests > 0 && (
                <span className="ml-auto flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-amber-500 text-white text-xs font-bold px-1">
                  {liveRequests}
                </span>
              )}
              {isMessages && unreadMessages > 0 && (
                <span className="ml-auto flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-brand-600 text-white text-xs font-bold px-1">
                  {unreadMessages}
                </span>
              )}
              {isAppeals && pendingAppeals > 0 && (
                <span className="ml-auto flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-amber-500 text-white text-xs font-bold px-1">
                  {pendingAppeals}
                </span>
              )}
              {isAdminAppeals && pendingAdminAppeals > 0 && (
                <span className="ml-auto flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-amber-500 text-white text-xs font-bold px-1">
                  {pendingAdminAppeals}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="px-3 pb-6 border-t border-gray-100 pt-3">
        <Link
          href="/settings"
          className={clsx(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            settingsActive
              ? 'bg-brand-50 text-brand-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Settings size={16} />
          {t('account.settings')}
        </Link>
      </div>
    </aside>
  )
}
