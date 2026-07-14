'use client'
import { Check } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { useTheme, THEMES, type Theme } from '@/lib/theme'

// A miniature app mock rendered *in* the given theme: setting data-theme on the
// wrapper cascades that theme's CSS variables to these children, so each swatch
// previews itself live (no hard-coded colours).
function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div
      data-theme={theme}
      className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 pointer-events-none select-none"
    >
      <div className="rounded-md bg-surface p-2 shadow-sm space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-brand-600" />
          <div className="h-1.5 flex-1 rounded-sm bg-gray-300" />
        </div>
        <div className="h-1.5 w-full rounded-sm bg-gray-700" />
        <div className="h-1.5 w-4/5 rounded-sm bg-gray-500" />
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-3 w-8 rounded-none bg-brand-700" />
          <div className="h-3 w-6 rounded-none border border-brand-200 bg-surface" />
        </div>
      </div>
    </div>
  )
}

export function DisplaySettings() {
  const [theme, setTheme] = useTheme()

  return (
    <Card>
      <CardTitle>Display</CardTitle>
      <CardDescription>Choose a colour scheme for reading and study. Applies instantly and is remembered on this device.</CardDescription>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {THEMES.map(t => {
          const active = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              title={t.hint}
              className={`group relative rounded-lg border-2 p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active ? 'border-brand-600' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThemePreview theme={t.id} />
              <div className="mt-2 flex items-center justify-between px-0.5 pb-0.5">
                <span className="text-sm font-medium text-gray-900">{t.label}</span>
                {active && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
