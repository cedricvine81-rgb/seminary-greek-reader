'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Calendar, ClipboardList,
  TrendingUp, BarChart2, BookMarked,
  Archive, FileText, Bell, Users, BookOpen, Building2, Mail, ShieldAlert,
} from 'lucide-react'

const instructorTabs = [
  { label: 'Dashboard',   href: '/instructor',             icon: LayoutDashboard },
  { label: 'Requests',    href: '/instructor/requests',    icon: Bell },
  { label: 'Messages',    href: '/instructor/messages',    icon: Mail },
  { label: 'Assignments', href: '/instructor/assignments', icon: ClipboardList },
  { label: 'Materials',   href: '/instructor/materials',   icon: FileText },
  { label: 'Reports',     href: '/instructor/reports',     icon: BarChart2 },
]

const studentTabs = [
  { label: 'Dashboard',   href: '/student',                icon: LayoutDashboard },
  { label: 'Assignments', href: '/student/assignments',    icon: ClipboardList },
  { label: 'Messages',    href: '/student/messages',       icon: Mail },
  { label: 'Grades',      href: '/student/scores',         icon: BarChart2 },
]

const adminTabs = [
  { label: 'Dashboard',    href: '/admin',               icon: LayoutDashboard },
  { label: 'Users',        href: '/admin/users',         icon: Users },
  { label: 'Courses',      href: '/admin/courses',       icon: BookOpen },
  { label: 'Institutions', href: '/admin/institutions',  icon: Building2 },
  { label: 'Audit',        href: '/admin/audit',         icon: ShieldAlert },
]

interface MobileNavProps {
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  pendingRequests?: number
}

export function MobileNav({ role, pendingRequests = 0 }: MobileNavProps) {
  const pathname = usePathname()
  const tabs = role === 'INSTRUCTOR' ? instructorTabs : role === 'ADMIN' ? adminTabs : studentTabs

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex">
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
              {isRequests && pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1.5 flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-amber-500 text-white text-[9px] font-bold px-0.5">
                  {pendingRequests}
                </span>
              )}
            </div>
            {/* truncate within the equal-width cell so long labels never wrap/misalign */}
            <span className="max-w-full truncate px-0.5">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
