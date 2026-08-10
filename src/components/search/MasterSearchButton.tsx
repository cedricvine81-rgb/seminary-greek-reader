'use client'

import { Search } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { openMasterSearch } from '@/lib/master-search-bus'

// Header search trigger — a bare magnifying glass (the symbol is universal, so no label).
// Desktop-only; on mobile the search entry lives in the right-hand menu (AccountMenu).
export function MasterSearchButton() {
  const t = useT()
  return (
    <button
      onClick={() => openMasterSearch()}
      title={t('search.searchShortcut')}
      aria-label={t('reader.search')}
      className="hidden md:inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
    >
      <Search size={18} />
    </button>
  )
}
