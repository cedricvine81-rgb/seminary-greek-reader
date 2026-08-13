'use client'
import { useTrack } from '@/lib/track-client'
import { BRANDS, type Track } from '@/lib/track'
import { useT } from '@/lib/i18n/LocaleProvider'

/**
 * The app mark, which is also the Greek/Hebrew switch.
 *
 * Rather than a logo with a separate control beside it, the two monograms are joined into
 * one segmented control — the same shape as the Reader's Verse/Word toggle — so the thing
 * you click IS the logo, and clicking it visibly rewrites the wordmark next to it.
 *
 * A view preference: it changes branding and what the shared tools open on. It does NOT
 * filter the dashboard and has no bearing on any course, quiz or grade — those follow
 * Course.level. See src/lib/track.ts.
 */
const ORDER: Track[] = ['greek', 'hebrew']

export function TrackToggle() {
  const [track, setTrack] = useTrack()
  const t = useT()

  return (
    <div
      role="group"
      aria-label={t('track.switch')}
      className="flex rounded-lg overflow-hidden shrink-0 border border-brand-600"
    >
      {ORDER.map(id => {
        const active = track === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => !active && setTrack(id)}
            aria-pressed={active}
            title={BRANDS[id].name}
            // Sized to the old logo square so the header keeps its proportions. Active is
            // the brand blue the mark has always been; inactive sits back on the surface.
            className={`w-10 h-8 flex items-center justify-center text-base font-bold tracking-tight transition-colors ${
              active
                ? 'bg-brand-600 text-parchment-100'
                : 'bg-surface text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            } ${id === 'hebrew' ? 'font-hebrew' : 'font-serif'}`}
          >
            {BRANDS[id].monogram}
          </button>
        )
      })}
    </div>
  )
}
