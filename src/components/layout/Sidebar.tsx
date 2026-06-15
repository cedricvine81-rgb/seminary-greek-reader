'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useApi } from '@/lib/api-client'
import {
  LayoutDashboard, BookMarked, Calendar, Archive,
  ClipboardList, BarChart2, FileText,
  FlipHorizontal, TrendingUp, Settings, Bell,
  Users, BookOpen, Building2, Mail, ShieldAlert, Gavel,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const instructorNav: NavItem[] = [
  { label: 'Dashboard',   href: '/instructor',               icon: <LayoutDashboard size={16} /> },
  { label: 'Requests',    href: '/instructor/requests',      icon: <Bell size={16} /> },
  { label: 'Messages',    href: '/instructor/messages',      icon: <Mail size={16} /> },
  { label: 'Assignments', href: '/instructor/assignments',   icon: <ClipboardList size={16} /> },
  { label: 'Appeals',     href: '/instructor/appeals',       icon: <Gavel size={16} /> },
  { label: 'Materials',   href: '/instructor/materials',     icon: <FileText size={16} /> },
  { label: 'Reports',     href: '/instructor/reports',       icon: <BarChart2 size={16} /> },
  { label: 'Archive',     href: '/instructor/archive',       icon: <Archive size={16} /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard',     href: '/admin',                    icon: <LayoutDashboard size={16} /> },
  { label: 'Users',         href: '/admin/users',              icon: <Users size={16} /> },
  { label: 'Courses',       href: '/admin/courses',            icon: <BookOpen size={16} /> },
  { label: 'Institutions',  href: '/admin/institutions',       icon: <Building2 size={16} /> },
  { label: 'Vocab Synonyms',href: '/admin/vocab/synonyms',     icon: <BookMarked size={16} /> },
  { label: 'Vocab Appeals', href: '/admin/appeals',            icon: <Gavel size={16} /> },
  { label: 'Audit Log',     href: '/admin/audit',              icon: <ShieldAlert size={16} /> },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard',   href: '/student',                  icon: <LayoutDashboard size={16} /> },
  { label: 'Calendar',    href: '/student/calendar',         icon: <Calendar size={16} /> },
  { label: 'Assignments', href: '/student/assignments',      icon: <ClipboardList size={16} /> },
  { label: 'Messages',    href: '/student/messages',         icon: <Mail size={16} /> },
  { label: 'Flashcards',  href: '/student/flashcards',       icon: <FlipHorizontal size={16} /> },
  { label: 'Accuracy',    href: '/student/progress',         icon: <TrendingUp size={16} /> },
  { label: 'Materials',   href: '/student/materials',        icon: <BookMarked size={16} /> },
]

interface SidebarProps {
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  pendingRequests?: number
}

export function Sidebar({ role, pendingRequests = 0 }: SidebarProps) {
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

  // Pending admin-tier appeals count for admins
  const { data: adminAppealsData } = useApi<{ count: number }>(
    role === 'ADMIN' ? '/api/admin/appeals/pending' : null,
    { refreshInterval: 60_000 },
  )
  const pendingAdminAppeals = adminAppealsData?.count ?? 0

  const settingsActive = pathname === '/settings'

  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-100 min-h-screen pt-6">
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
              <span className="flex-1">{item.label}</span>
              {isRequests && pendingRequests > 0 && (
                <span className="ml-auto flex items-center justify-center h-5 min-w-[1.25rem] rounded-full bg-amber-500 text-white text-xs font-bold px-1">
                  {pendingRequests}
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
          Settings
        </Link>
      </div>
    </aside>
  )
}
