'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogIn, UserPlus, LogOut, Settings } from 'lucide-react'

interface AccountMenuProps {
  isAuthenticated: boolean
  userRole?: 'INSTRUCTOR' | 'STUDENT'
  userName?: string
}

export function AccountMenu({ isAuthenticated, userRole, userName }: AccountMenuProps) {
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
        <div className="absolute right-0 top-11 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {isAuthenticated ? (
            <>
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-brand-600 capitalize">{userRole?.toLowerCase()}</p>
              </div>
              <Link
                href={userRole === 'INSTRUCTOR' ? '/instructor' : '/student'}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <User size={15} /> Dashboard
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                <Settings size={15} /> Settings
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} /> Sign Out
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
              <hr className="my-1 border-gray-100" />
            </>
          )}
        </div>
      )}
    </div>
  )
}
