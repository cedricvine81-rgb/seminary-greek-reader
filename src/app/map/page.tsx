import type { Metadata } from 'next'
import { PlacesMap } from '@/components/map/PlacesMap'

export const metadata: Metadata = { title: 'Map' }

// Where the Texts library's authors say things happened. Perseus tags place names in its English
// translations with a gazetteer key; scripts/build-places.py collects those 19,180 tags and gives
// them coordinates, and this page draws them. Reached from the Texts menu.
export default function MapPage() {
  return (
    <main className="reader-container-h mx-auto flex w-full max-w-7xl flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div className="mb-3">
        <h1 className="text-lg font-semibold text-gray-800">The world of the texts</h1>
        <p className="mt-0.5 text-sm text-gray-600">
          Every place named by Herodotus, Thucydides, Strabo, Pausanias, Polybius and the orators,
          sized by how often each is mentioned. Drag to pan, scroll to zoom, click a place to see
          which authors speak of it.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <PlacesMap />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-gray-400">
        Place tags: Perseus Digital Library (CC-BY-SA 4.0). Coordinates: Perseus and the Pleiades
        gazetteer of ancient places (pleiades.stoa.org, CC-BY). Coastline: Natural Earth (public
        domain). Nine mentions in ten are placed; the rest are regions and adjectival forms with
        no single point.
      </p>
    </main>
  )
}
