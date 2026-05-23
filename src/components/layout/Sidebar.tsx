'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, BookOpen, BookMarked, Users,
  ClipboardList, BarChart2, FileText, GraduationCap,
  FlipHorizontal, TrendingUp, Settings,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const instructorNav: NavItem[] = [
  { label: 'Dashboard',   href: '/instructor',               icon: <LayoutDashboard size={16} /> },
  { label: 'Courses',     href: '/instructor/courses',       icon: <BookOpen size={16} /> },
  { label: 'Assignments', href: '/instructor/assignments',   icon: <ClipboardList size={16} /> },
  { label: 'Materials',   href: '/instructor/materials',     icon: <FileText size={16} /> },
  { label: 'Students',    href: '/instructor/students',      icon: <Users size={16} /> },
  { label: 'Reports',     href: '/instructor/reports',       icon: <BarChart2 size={16} /> },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard',   href: '/student',                  icon: <LayoutDashboard size={16} /> },
  { label: 'Courses',     href: '/student/courses',          icon: <GraduationCap size={16} /> },
  { label: 'Assignments', href: '/student/assignments',      icon: <ClipboardList size={16} /> },
  { label: 'Flashcards',  href: '/student/flashcards',       icon: <FlipHorizontal size={16} /> },
  { label: 'Progress',    href: '/student/progress',         icon: <TrendingUp size={16} /> },
  { label: 'Scores',      href: '/student/scores',           icon: <BarChart2 size={16} /> },
  { label: 'Materials',   href: '/student/materials',        icon: <BookMarked size={16} /> },
]

interface SidebarProps {
  role: 'INSTRUCTOR' | 'STUDENT'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = role === 'INSTRUCTOR' ? instructorNav : studentNav

  const settingsActive = pathname === '/settings'

  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col bg-white border-r border-gray-100 min-h-screen pt-6">
      {/* Main nav */}
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/instructor' && item.href !== '/student' && pathname.startsWith(item.href))
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
              {item.label}
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
