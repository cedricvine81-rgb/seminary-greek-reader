'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { featureLabel, groupLabel } from '@/lib/i18n/morph-labels'
import {
  axesFor, defaultSpec, fieldsFor, FIELD_GROUPS, PRACTICE_SUBTYPES, type CustomMorphSpec,
} from '@/lib/morph-practice-custom'
import type { MorphLang } from '@/lib/morph-grammar-links'
import { PracticeMorphQuiz } from '@/components/student/PracticeMorphQuiz'
import { BGVB_LESSON_COUNT } from '@/lib/self-study'

// Build your own parsing drill: part of speech, what you will be asked, which forms to draw
// from — with a LIVE COUNT of how many forms match.
//
// The count is not decoration. A student can easily describe a combination the corpus does not
// contain ("pluperfect middle imperative"), and the generators deliberately fall back when a
// filter matches too little — so without the count they would be handed a quiz that quietly
// ignored what they asked for. Every change re-counts; Start is disabled at zero.
//
// Nothing here is recorded. The session ends in the same report of what to work on that the
// assignment and chapter drills give.

const QUESTIONS = 15
const DEBOUNCE_MS = 250

/** One axis of the filter: chips, none selected meaning "any value". */
function AxisChips({ label, values, selected, onToggle, onClear }: {
  label: string
  values: string[]
  selected: string[]
  onToggle: (v: string) => void
  onClear: () => void
}) {
  const t = useT()
  const all = selected.length === 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        {!all && (
          <button onClick={onClear} className="text-xs font-medium text-brand-600 hover:text-brand-800">
            {t('pr.b.any')}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map(v => {
          const on = selected.includes(v)
          return (
            <button
              key={v}
              onClick={() => onToggle(v)}
              aria-pressed={on}
              className={clsx(
                'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                on
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : all
                    ? 'border-gray-200 bg-surface text-gray-600 hover:border-brand-300'
                    : 'border-gray-200 bg-surface text-gray-400 hover:border-brand-300 hover:text-gray-600',
              )}
            >
              {featureLabel(v, t)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CustomMorphBuilder({ defaultLang = 'greek' }: { defaultLang?: MorphLang }) {
  const t = useT()
  const [spec, setSpec] = useState<CustomMorphSpec>(() => defaultSpec(defaultLang, 'VERB_PARSING'))
  const [count, setCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  // A failed count is NOT "still counting": null means both, so without this a rate-limited or
  // offline student watches "Counting the forms…" for ever with Start disabled and no reason.
  const [countFailed, setCountFailed] = useState(false)
  const [running, setRunning] = useState<CustomMorphSpec | null>(null)

  const axes = useMemo(() => axesFor(spec.lang, spec.subtype), [spec.lang, spec.subtype])
  const fields = useMemo(() => fieldsFor(spec.lang, spec.subtype), [spec.lang, spec.subtype])

  // Re-count on every change, debounced. The abort matters as much as the debounce: chips are
  // fast to click, and a slower earlier answer must not land on top of a newer one.
  const seq = useRef(0)
  useEffect(() => {
    if (running) return
    const mine = ++seq.current
    const ctl = new AbortController()
    setCounting(true)
    setCountFailed(false)
    const timer = setTimeout(() => {
      fetch('/api/practice/morph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...spec, count: 0 }),
        signal: ctl.signal,
      })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: { count: number }) => {
          if (mine === seq.current) { setCount(d.count); setCounting(false) }
        })
        .catch((e: Error) => {
          // An abort is this effect being superseded, not a failure — the next run reports.
          if (e.name === 'AbortError' || mine !== seq.current) return
          setCount(null); setCounting(false); setCountFailed(true)
        })
    }, DEBOUNCE_MS)
    return () => { clearTimeout(timer); ctl.abort() }
  }, [spec, running])

  const setLang = useCallback((lang: MorphLang) => setSpec(defaultSpec(lang, 'VERB_PARSING')), [])
  const setSubtype = useCallback((subtype: string) =>
    setSpec(s => defaultSpec(s.lang, subtype)), [])

  function toggleField(f: string) {
    setSpec(s => ({
      ...s,
      fields: s.fields.includes(f) ? s.fields.filter(x => x !== f) : [...s.fields, f],
    }))
  }

  function toggleValue(axis: string, v: string) {
    setSpec(s => {
      const cur = s.parseFilter[axis] ?? []
      const next = cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]
      const filter = { ...s.parseFilter }
      if (next.length) filter[axis] = next
      else delete filter[axis]
      return { ...s, parseFilter: filter }
    })
  }

  function clearAxis(axis: string) {
    setSpec(s => {
      const filter = { ...s.parseFilter }
      delete filter[axis]
      return { ...s, parseFilter: filter }
    })
  }

  if (running) {
    return (
      <PracticeMorphQuiz
        custom={running}
        onExit={() => { setRunning(null); setCount(null) }}
      />
    )
  }

  const empty = count === 0
  const thin = count != null && count > 0 && count < QUESTIONS

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/student" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <ArrowLeft size={14} /> {t('nav.dashboard')}
      </Link>

      <div>
        <h1 className="text-lg font-bold text-gray-900">{t('pr.b.title')}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{t('pr.b.intro')}</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-gray-200 bg-surface p-5">
        {/* Language. Both are offered whatever track the student is on: someone revising
            Greek from the Hebrew side is one click away, as everywhere else in the app. */}
        <div className="flex flex-wrap items-center gap-2">
          {(['greek', 'hebrew'] as MorphLang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={spec.lang === l}
              className={clsx('rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                spec.lang === l
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-gray-200 bg-surface text-gray-600 hover:text-gray-900')}
            >
              {t(`track.${l}`)}
            </button>
          ))}
        </div>

        {/* Part of speech */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t('pr.b.partOfSpeech')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRACTICE_SUBTYPES.map(st => (
              <button
                key={st}
                onClick={() => setSubtype(st)}
                aria-pressed={spec.subtype === st}
                className={clsx('rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  spec.subtype === st
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-surface text-gray-600 hover:border-brand-300')}
              >
                {t(`morph.subtype.${st}`)}
              </button>
            ))}
          </div>
        </div>

        {/* What you will be asked. Ticking a field also SELECTS the forms: only forms that
            carry every ticked field can be drawn, so asking for Case on a Greek verb yields a
            participle drill. That is a feature, and the count makes it visible. */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {t('pr.b.askMeFor')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {fields.map(f => (
              <button
                key={f}
                onClick={() => toggleField(f)}
                aria-pressed={spec.fields.includes(f)}
                className={clsx('rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
                  spec.fields.includes(f)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-surface text-gray-400 hover:border-brand-300 hover:text-gray-600')}
              >
                {groupLabel(FIELD_GROUPS[f] ?? f, t, f)}
              </button>
            ))}
          </div>
          {spec.fields.length === 0 && (
            <p className="text-xs text-gray-500">{t('pr.b.allFields')}</p>
          )}
        </div>

        {/* Which forms to draw from */}
        <div className="space-y-4 border-t border-gray-100 pt-4">
          {axes.map(a => (
            <AxisChips
              key={a.key}
              label={groupLabel(a.group, t, a.key)}
              values={a.values}
              selected={spec.parseFilter[a.key] ?? []}
              onToggle={v => toggleValue(a.key, v)}
              onClear={() => clearAxis(a.key)}
            />
          ))}
        </div>

        {/* Vocabulary cap — Greek only. The Hebrew drills run uncapped for the reason the
            self-study ladder documents: the frequent Hebrew verbs are nearly all weak, so
            capping a verb drill by taught vocabulary empties it. */}
        {spec.lang === 'greek' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {t('pr.b.vocabCap')}
            </label>
            <select
              value={spec.vocabThruLesson ?? ''}
              onChange={e => setSpec(s => ({
                ...s, vocabThruLesson: e.target.value ? Number(e.target.value) : null,
              }))}
              className="rounded-lg border border-gray-300 bg-surface px-2 py-1.5 text-sm text-gray-800"
            >
              <option value="">{t('pr.b.vocabAny')}</option>
              {Array.from({ length: BGVB_LESSON_COUNT }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{t('pr.b.vocabThru', { n })}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* The live count, and the only way to start. */}
      <div className={clsx('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3',
        empty || countFailed ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50')}>
        {/* The count is the feedback for every chip pressed, so it has to be spoken as well as
            shown — otherwise a screen-reader user toggles values and hears nothing change. */}
        <p
          aria-live="polite"
          aria-atomic="true"
          className={clsx('text-sm', empty || countFailed ? 'text-amber-800' : 'text-gray-600')}
        >
          {countFailed
            ? t('pr.b.countFailed')
            : counting || count === null
              ? t('pr.b.counting')
              : empty
                ? t('pr.b.noForms')
                : thin
                  ? t('pr.b.formsThin', { count })
                  : t('pr.b.forms', { count })}
        </p>
        <button
          onClick={() => setRunning(spec)}
          disabled={!count}
          className="btn btn-primary inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-40"
        >
          <Dumbbell size={15} /> {t('pr.b.start')}
        </button>
      </div>

      <button
        onClick={() => setSpec(defaultSpec(spec.lang, spec.subtype))}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        <RotateCcw size={14} /> {t('pr.b.reset')}
      </button>
    </div>
  )
}
