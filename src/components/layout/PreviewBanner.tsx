'use client'
import { usePathname } from 'next/navigation'
import { EyeOff } from 'lucide-react'

interface PreviewBannerInnerProps {
  show: boolean
}

export function PreviewBannerInner({ show }: PreviewBannerInnerProps) {
  const pathname = usePathname()
  if (!show || !pathname.startsWith('/student')) return null

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4 z-50">
      <div className="flex items-center gap-2 text-sm font-medium">
        <EyeOff size={16} className="shrink-0" />
        <span>Instructor Preview — you are viewing the student experience</span>
      </div>
      <a
        href="/api/preview?mode=exit"
        className="shrink-0 text-sm font-semibold bg-surface text-amber-700 hover:bg-amber-50 px-3 py-1 rounded-lg transition-colors"
      >
        ← Return to Dashboard
      </a>
    </div>
  )
}
