'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useApi } from '@/lib/api-client'
import {
  LayoutDashboard, Calendar, ClipboardList,
  TrendingUp, BarChart2, BookMarked,
  Archive, FileText, Bell, Users, BookOpen, Building2, Mail, ShieldAlert, Settings, Bug, Activity } from 'lucide-react'

const instructorTabs = [
  { label: 'nav.dashboard',   href: '/instructor',             icon: LayoutDashboard },
  { label: 'nav.requests',    href: '/instructor/requests',    icon: Bell },
  { label: 'nav.messages',    href: '/instructor/messages',    icon: Mail },
  { label: 'nav.assignments', href: '/instructor/assignments', icon: ClipboardList },
  { label: 'nav.materials',   href: '/instructor/materials',   icon: FileText },
  { label: 'nav.reports',     href: '/instructor/reports',     icon: BarChart2 },
]

const studentTabs = [
  { label: 'nav.dashboard',   href: '/student',                icon: LayoutDashboard },
  { label: 'nav.assignments', href: '/student/assignments',    icon: ClipboardList },
  { label: 'nav.messages',    href: '/student/messages',       icon: Mail },
  { label: 'nav.grades',      href: '/student/scores',         icon: BarChart2 },
]

const adminTabs = [
  { label: 'nav.dashboard',    href: '/admin',               icon: LayoutDashboard },
  { label: 'nav.users',        href: '/admin/users',         icon: Users },
  { label: 'nav.courses',      href: '/admin/courses',       icon: BookOpen },
  { label: 'nav.institutions', href: '/admin/institutions',  icon: Building2 },
  { label: 'Audit',        href: '/admin/audit',         icon: ShieldAlert },
  { label: 'Errors',       href: '/admin/errors',        icon: Bug },
  { label: 'nav.systemHealth', href: '/admin/health',    icon: Activity },
  { label: 'Notifications', href: '/admin/settings',     icon: Settings },
]

interface MobileNavProps {
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  pendingRequests?: number
}

export function MobileNav({ role, pendingRequests = 0 }: MobileNavProps) {
  const t = useT()
  const pathname = usePathname()
  const tabs = role === 'INSTRUCTOR' ? instructorTabs : role === 'ADMIN' ? adminTabs : studentTabs

  // Poll pending enrollment requests live so the badge flags new submissions without a
  // reload; the server-passed count seeds the first render until SWR has data.
  const { data: requestsData } = useApi<{ pending: unknown[] }>(
    role === 'INSTRUCTOR' ? '/api/enrollments/pending' : null,
    { refreshInterval: 60_000 },
  )
  const liveRequests = requestsData ? requestsData.pending.length : pendingRequests

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-gray-200 flex">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== '/instructor' && href !== '/student' && href !== '/admin' && pathname.startsWith(href))
        const isRequests = href === '/instructor/requests'
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative',
              active ? 'text-brand-700' : 'text-gray-500'
            )}
          >
            <div className="relative">
              <Icon size={20} />
              {isRequests && liveRequests > 0 && (
                <span className="absolute -top-1 -right-1.5 flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-amber-500 text-white text-[9px] font-bold px-0.5">
                  {liveRequests}
                </span>
              )}
            </div>
            {/* truncate within the equal-width cell so long labels never wrap/misalign */}
            <span className="max-w-full truncate px-0.5">{t(label)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
