'use client'
import { Check } from 'lucide-react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { useTheme, THEMES, type Theme } from '@/lib/theme'
import { useTextScale, TEXT_SCALES, type TextScale } from '@/lib/text-scale'

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
          <div className="h-3 w-8 rounded-sm bg-brand-700" />
          <div className="h-3 w-6 rounded-sm border border-brand-200 bg-surface" />
        </div>
      </div>
    </div>
  )
}

export function DisplaySettings() {
  const [theme, setTheme] = useTheme()
  const [scale, setScale] = useTextScale()

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

      {/* Text size — applies across the app (Grammar, Reader, Exegesis, quizzes). */}
      <div className="mt-7 border-t border-gray-100 pt-5">
        <p className="text-sm font-medium text-gray-900">Text size</p>
        <p className="mt-0.5 text-sm text-gray-500">
          Sets the size of text everywhere in the app. Applies instantly and is remembered on this device.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEXT_SCALES.map(sc => {
            const active = scale === sc.id
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScale(sc.id as TextScale)}
                aria-pressed={active}
                title={sc.hint}
                className={`rounded-lg border-2 px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  active ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Each chip previews its own size, so the choice is visible before it is made. */}
                <span className="block font-medium text-gray-900" style={{ fontSize: `${sc.pct}%` }}>Aa</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                  {sc.label}
                  {active && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
