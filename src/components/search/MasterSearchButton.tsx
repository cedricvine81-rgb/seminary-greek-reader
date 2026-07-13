'use client'

import { Search } from 'lucide-react'
import { openMasterSearch } from '@/lib/master-search-bus'

// Header search trigger — a bare magnifying glass (the symbol is universal, so no label).
// Desktop-only; on mobile the search entry lives in the right-hand menu (AccountMenu).
export function MasterSearchButton() {
  return (
    <button
      onClick={openMasterSearch}
      title="Search (⌘K)"
      aria-label="Search"
      className="hidden md:inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
    >
      <Search size={18} />
    </button>
  )
}
