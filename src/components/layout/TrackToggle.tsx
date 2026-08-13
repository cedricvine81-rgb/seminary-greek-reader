'use client'
import { useTrack } from '@/lib/track-client'
import { BRANDS, type Track } from '@/lib/track'
import { useT } from '@/lib/i18n/LocaleProvider'

/**
 * Switches the app between Seminary Greek and Seminary Hebrew.
 *
 * A view preference: it changes the branding and what the shared tools open on. It does NOT
 * filter the dashboard and has no bearing on any course, quiz or grade — those follow
 * Course.level. See src/lib/track.ts.
 */
const ORDER: Track[] = ['greek', 'hebrew']

export function TrackToggle({ compact = false }: { compact?: boolean }) {
  const [track, setTrack] = useTrack()
  const t = useT()

  return (
    <div
      role="group"
      aria-label={t('track.switch')}
      className="inline-flex items-center rounded-lg border border-gray-200 bg-parchment-50 p-0.5"
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
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              active
                ? 'bg-brand-600 text-parchment-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className={id === 'hebrew' ? 'font-hebrew' : 'font-serif'}>
              {BRANDS[id].monogram}
            </span>
            {!compact && (
              <span className="ml-1.5 hidden lg:inline">{t(`track.${id}`)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
