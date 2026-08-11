import type { Metadata } from 'next'
import { PlacesMap } from '@/components/map/PlacesMap'
import { getServerT } from '@/lib/i18n/server'

export const metadata: Metadata = { title: 'Map' }

// Where the Texts library's authors say things happened. Perseus tags place names in its English
// translations with a gazetteer key; scripts/build-places.py collects those 19,180 tags and gives
// them coordinates, and this page draws them. Reached from the Texts menu.
export default function MapPage() {
  const t = getServerT()
  return (
    <main className="reader-container-h mx-auto flex w-full max-w-7xl flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-gray-800">{t('map.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-600">{t('map.intro')}</p>
      </div>
      <div className="min-h-0 flex-1">
        <PlacesMap />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-gray-400">{t('map.attribution')}</p>
    </main>
  )
}
