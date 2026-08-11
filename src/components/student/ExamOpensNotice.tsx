'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'

/**
 * Pre-exam gate shown to a student who opens a Translation Exam before its start
 * time: the open time in the viewer's local zone plus a live countdown, and an
 * automatic refresh the moment the exam opens.
 *
 * All time/locale computation is deferred until after mount. Server-side rendering
 * and the first client render show an identical static placeholder, so there is no
 * hydration mismatch (which would otherwise crash into the error boundary).
 */
export function ExamOpensNotice({ opensAtIso }: { opensAtIso: string }) {
  const opensAt = new Date(opensAtIso).getTime()
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(opensAt)   // placeholder value until mounted (never rendered)
  const [localTime, setLocalTime] = useState('')
  const router = useRouter()
  const t = useT()
  const locale = useLocale()
  const refreshedRef = useRef(false)

  // Everything time-dependent runs only in the browser, after hydration.
  useEffect(() => {
    setMounted(true)
    setNow(Date.now())
    // Explicit field options (not dateStyle/timeStyle) so timeZoneName is allowed —
    // Safari throws a TypeError if dateStyle/timeStyle are mixed with other options.
    setLocalTime(new Date(opensAtIso).toLocaleString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }))
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [opensAtIso, locale])

  const remaining = opensAt - now
  const isOpen = mounted && remaining <= 0

  // The instant the countdown reaches zero, re-run the server component so the exam
  // becomes available. Guarded so it fires exactly once.
  useEffect(() => {
    if (isOpen && !refreshedRef.current) { refreshedRef.current = true; router.refresh() }
  }, [isOpen, router])

  function fmt(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000))
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    // Unit letters are keys: Spanish abbreviates minutes "min", not "m".
    const [D, H, M, S] = [t('exam.unit.d'), t('exam.unit.h'), t('exam.unit.m'), t('exam.unit.s')]
    if (d > 0) return `${d}${D} ${h}${H} ${pad(m)}${M}`
    if (h > 0) return `${h}${H} ${pad(m)}${M} ${pad(sec)}${S}`
    if (m > 0) return `${m}${M} ${pad(sec)}${S}`
    return `${sec}${S}`
  }

  // Server + first client render: a static placeholder with no time math, so SSR and
  // hydration are identical.
  if (!mounted) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-6 text-center">
        <div className="text-3xl mb-2">⏳</div>
        <p className="text-sm font-semibold text-brand-800">{t('exam.notOpenYet')}</p>
        <p className="mt-3 text-sm text-brand-600">{t('exam.loadingCountdown')}</p>
      </div>
    )
  }

  if (isOpen) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-lg font-semibold text-emerald-800">{t('exam.nowOpen')}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {t('exam.startExam')}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-6 text-center">
      <div className="text-3xl mb-2">⏳</div>
      <p className="text-sm font-semibold text-brand-800">{t('exam.notOpenYet')}</p>
      <p className="mt-3 text-4xl font-bold tabular-nums text-brand-800">{fmt(remaining)}</p>
      <p className="mt-2 text-sm text-brand-700">{t('exam.opensAt', { when: localTime || '…' })}</p>
      <p className="mt-3 text-xs text-brand-500">{t('exam.keepPageOpen')}</p>
    </div>
  )
}
