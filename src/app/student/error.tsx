'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[student]', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-red-50 rounded-xl">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
        <p className="text-sm text-gray-500">
          An error occurred loading this page. Your progress is saved — try refreshing or return to your dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
          >
            <RefreshCw size={14} /> Try again
          </button>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface text-brand-700 border border-brand-200 text-sm font-medium rounded-lg hover:bg-brand-50 transition-colors"
          >
            <LayoutDashboard size={14} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
