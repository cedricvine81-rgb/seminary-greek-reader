'use client'

/**
 * The app's standard on/off control: a two-button On | Off segmented pair
 * (originating in the Reader's Syntax-sources flyout). Use this rather than a
 * checkbox for boolean settings so they look the same in every menu.
 */
export function OnOff({ value, onChange }: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex shrink-0 rounded-md border border-gray-200 overflow-hidden text-sm">
      {([true, false] as const).map(on => (
        <button
          key={String(on)}
          type="button"
          aria-pressed={value === on}
          onClick={() => onChange(on)}
          className={`px-4 py-1.5 transition-colors ${
            value === on
              ? 'bg-brand-50 text-brand-700 font-medium'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {on ? 'On' : 'Off'}
        </button>
      ))}
    </div>
  )
}
