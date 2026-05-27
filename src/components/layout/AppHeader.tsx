import Link from 'next/link'
import Image from 'next/image'
import { AccountMenu } from './AccountMenu'
import { BookOpen, BookMarked } from 'lucide-react'

interface AppHeaderProps {
  isAuthenticated?: boolean
  userRole?: 'INSTRUCTOR' | 'STUDENT'
  userName?: string
}

export function AppHeader({ isAuthenticated = false, userRole, userName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-8 bg-brand-800 rounded-lg flex items-center justify-center">
            <span className="text-parchment-100 font-serif text-base font-bold tracking-tight">ΣΓ</span>
          </div>
          <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors hidden sm:block">
            Seminary Greek
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/reader" className="px-3 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookOpen size={15} /> Reader
          </Link>
          <Link href="/vocab" className="px-3 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1.5">
            <BookMarked size={15} /> Vocab
          </Link>
          {isAuthenticated && userRole === 'INSTRUCTOR' && (
            <Link href="/instructor" className="px-3 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors">
              Dashboard
            </Link>
          )}
          {isAuthenticated && userRole === 'STUDENT' && (
            <Link href="/student" className="px-3 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right: hamburger menu */}
        <AccountMenu isAuthenticated={isAuthenticated} userRole={userRole} userName={userName} />
      </div>
    </header>
  )
}
