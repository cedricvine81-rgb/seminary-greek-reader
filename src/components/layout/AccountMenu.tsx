'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Menu, X, LogIn, UserPlus, LogOut, Settings,
  LayoutDashboard, Calendar, ClipboardList, FileText,
  BarChart2, GraduationCap, TrendingUp,
  BookMarked, Archive, Mail, Users,
} from 'lucide-react'

interface AppMenuProps {
  isAuthenticated: boolean
  userRole?: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  userName?: string
}

const INSTRUCTOR_NAV = [
  { href: '/instructor',            label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/instructor/assignments',label: 'Assignments',  icon: ClipboardList },
  { href: '/instructor/materials',  label: 'Materials',    icon: FileText },
  { href: '/instructor/reports',    label: 'Reports',      icon: BarChart2 },
  { href: '/instructor/archive',    label: 'Archive',      icon: Archive },
]

const STUDENT_NAV = [
  { href: '/student',               label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/student/calendar',      label: 'Calendar',     icon: Calendar },
  { href: '/student/assignments',   label: 'Assignments',  icon: ClipboardList },
  { href: '/student/group-presentations', label: 'Group Work', icon: Users },
  { href: '/student/messages',      label: 'Messages',     icon: Mail },
  { href: '/student/progress',      label: 'Accuracy',     icon: TrendingUp },
  { href: '/student/scores',        label: 'Grades',       icon: BarChart2 },
  { href: '/student/materials',     label: 'Materials',    icon: BookMarked },
]

export function AccountMenu({ isAuthenticated, userRole, userName }: AppMenuProps) {
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
    : userRole === 'ADMIN' ? [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
    : []

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {isAuthenticated && userName && (
        <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName.split(' ')[0]}</span>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 max-h-[80vh] overflow-y-auto">
          {isAuthenticated ? (
            <>
              {/* User info */}
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-brand-600 capitalize">{userRole?.toLowerCase()}</p>
              </div>

              {/* Navigation — mobile only. On desktop the left sidebar already
                  provides full navigation, so the dropdown stays account-focused
                  (avoids duplicating the sidebar). */}
              {nav.length > 0 && (
                <div className="lg:hidden">
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Navigation</p>
                  </div>
                  {nav.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={15} className="text-gray-400 shrink-0" />
                      {label}
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
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="shrink-0" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <LogIn size={15} /> Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <UserPlus size={15} /> Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
