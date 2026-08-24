'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { morphQuizFor, morphKeyFor, MORPH_PASS_PCT } from '@/lib/self-study-morph'
import { MORPH_OPTIONS } from '@/data/morphology-options'
import {
  POOL_STEMS, POOL_CONJUGATIONS, POOL_PERSONS, POOL_GENDERS, POOL_NUMBERS,
  POOL_STATES, POOL_PRONOUN_TYPES,
} from '@/lib/quiz-fields-hebrew'

// Auto-graded parsing practice for a self-study lesson. Questions are generated
// server-side (/api/self-study/morph) from the instructor-quiz corpus pools — fresh forms
// every attempt — and graded here, field by field. Scoring is per parsing field, not per
// form (four of five fields right is 80%, not zero); reaching MORPH_PASS_PCT of the
// fields records the lesson's morph-step key in the shared progress store.

interface MorphQ {
  position: number
  type: string
  prompt: string
  correctAnswer: string
  options: string[]
  points: number
  reference: string | null
}

/** Display order + option lists for every field a generated answer can carry. */
function fieldMap(hebrew: boolean, t: (k: string) => string): [string, { label: string; opts: string[] }][] {
  return hebrew
    ? [
        ['stem',        { label: t('morph.stem'),        opts: POOL_STEMS }],
        ['conjugation', { label: t('morph.conjugation'), opts: POOL_CONJUGATIONS }],
        ['person',      { label: t('morph.person'),      opts: POOL_PERSONS }],
        ['gender',      { label: t('morph.gender'),      opts: POOL_GENDERS }],
        ['number',      { label: t('morph.number'),      opts: POOL_NUMBERS }],
        ['state',       { label: t('morph.state'),       opts: POOL_STATES }],
        ['type',        { label: t('quiz.pronounType'),  opts: POOL_PRONOUN_TYPES }],
      ]
    : [
        ['tense',       { label: t('morph.tense'),       opts: MORPH_OPTIONS.tense }],
        ['voice',       { label: t('morph.voice'),       opts: MORPH_OPTIONS.voice }],
        ['mood',        { label: t('morph.mood'),        opts: MORPH_OPTIONS.mood }],
        ['person',      { label: t('morph.person'),      opts: MORPH_OPTIONS.person }],
        ['number',      { label: t('morph.number'),      opts: MORPH_OPTIONS.number }],
        ['casus',       { label: t('morph.case'),        opts: MORPH_OPTIONS.case }],
        ['gender',      { label: t('morph.gender'),      opts: MORPH_OPTIONS.gender }],
        ['pronounType', { label: t('quiz.pronounType'),  opts: MORPH_OPTIONS.pronounType }],
      ]
}

/** "surface  (lexeme — gloss)" → its two display parts. */
function splitPrompt(prompt: string): { surface: string; note: string | null } {
  const m = prompt.match(/^(\S+)\s\s\((.*)\)\s*$/)
  return m ? { surface: m[1], note: m[2] } : { surface: prompt, note: null }
}

export function PracticeMorphQuiz({ trackId, lessonNo, embedded }: {
  trackId: string
  lessonNo: number
  embedded?: boolean
}) {
  const t = useT()
  const def = morphQuizFor(trackId, lessonNo)
  const stepKey = morphKeyFor(trackId, lessonNo)
  const { completed, setChapter } = useCourseProgress()

  const [questions, setQuestions] = useState<MorphQ[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [earned, setEarned] = useState(0)
  const [possible, setPossible] = useState(0)

  const load = useCallback(() => {
    setQuestions(null)
    setFailed(false)
    setIdx(0)
    setDraft({})
    setChecked(false)
    setEarned(0)
    setPossible(0)
    fetch(`/api/self-study/morph?track=${trackId}&lesson=${lessonNo}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { questions: MorphQ[] }) => {
        if (data.questions?.length) setQuestions(data.questions)
        else setFailed(true)
      })
      .catch(() => setFailed(true))
  }, [trackId, lessonNo])

  useEffect(() => { load() }, [load])

  if (!def) return null
  const hebrew = def.lang === 'hebrew'
  const trackHref = `/student/self-study/${trackId}`
  const alreadyDone = completed.has(stepKey)
  const hasVocabCap = def.lang === 'greek' ? def.vocabThruLesson != null : !!def.vocabThruBand

  const finished = questions !== null && idx >= questions.length
  const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0
  const passed = pct >= MORPH_PASS_PCT

  const q = questions?.[Math.min(idx, (questions?.length ?? 1) - 1)]
  const isMC = q?.type === 'MULTIPLE_CHOICE'
  let correctObj: Record<string, string | null> = {}
  if (q && !isMC) { try { correctObj = JSON.parse(q.correctAnswer) } catch { /* MC-style */ } }
  const activeFields = q && !isMC
    ? fieldMap(hebrew, t).filter(([f]) => correctObj[f])
    : []
  const requiredFilled = isMC || activeFields.every(([f]) => draft[f])

  function checkParse() {
    if (!q || checked) return
    const right = activeFields.filter(([f]) => draft[f] === correctObj[f]).length
    setEarned(e => e + right)
    setPossible(p => p + activeFields.length)
    setChecked(true)
  }

  function chooseMC(opt: string) {
    if (!q || checked) return
    setDraft({ mc: opt })
    setEarned(e => e + (opt === q.correctAnswer ? 1 : 0))
    setPossible(p => p + 1)
    setChecked(true)
  }

  function next() {
    if (!questions) return
    const n = idx + 1
    setIdx(n)
    setDraft({})
    setChecked(false)
    // Grade on the last answer: pass records the step; a fail records nothing.
    if (n >= questions.length && possible > 0
        && Math.round((earned / possible) * 100) >= MORPH_PASS_PCT) {
      setChapter(stepKey, true)
    }
  }

  const { surface, note } = q ? splitPrompt(q.prompt) : { surface: '', note: null }

  return (
    <div className="max-w-xl space-y-5">
      {!embedded && (
        <Link href={trackHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
          <ArrowLeft size={14} /> {t('ss.q.backToTrack')}
        </Link>
      )}

      <div>
        <h1 className="text-lg font-bold text-gray-900">{t(def.labelKey)} · {t('ss.lessonN', { n: lessonNo })}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {t('ss.q.parseNote', { pass: MORPH_PASS_PCT })}
          {hasVocabCap && <span> {t('ss.q.vocabCapNote')}</span>}
          {alreadyDone && <span className="ml-1 text-green-600 font-medium">{t('ss.q.alreadyPassed')}</span>}
        </p>
      </div>

      {failed ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-surface p-6 text-center">
          <p className="text-sm text-gray-500">{t('ss.q.loadFail')}</p>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RotateCcw size={14} /> {t('ss.q.tryAgain')}
          </button>
        </div>
      ) : questions === null ? (
        <p className="py-8 text-sm italic text-gray-400">{t('hw.loading')}</p>
      ) : finished ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-6 text-center">
          <p className="text-5xl font-bold text-gray-900">{pct}%</p>
          <p className={clsx('text-sm font-medium', passed ? 'text-green-600' : 'text-amber-600')}>
            {passed ? t('ss.q.passed') : t('ss.q.notPassed', { pass: MORPH_PASS_PCT })}
          </p>
          <p className="text-xs text-gray-400">{t('ss.q.fieldsRight', { correct: earned, total: possible })}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RotateCcw size={14} /> {t('ss.q.tryAgain')}
            </button>
            {!embedded && (
              <Link href={trackHref} className="inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                {t('ss.q.backToTrack')}
              </Link>
            )}
          </div>
        </div>
      ) : q ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-gray-400">{idx + 1} / {questions.length}</span>
          </div>

          {isMC ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-surface p-5">
                <p className={clsx('whitespace-pre-line text-sm text-gray-900', !hebrew && 'font-reading')}>{q.prompt}</p>
              </div>
              <div className="grid gap-2">
                {(q.options ?? []).map(opt => {
                  const isAnswer = opt === q.correctAnswer
                  const isChosen = opt === draft.mc
                  return (
                    <button
                      key={opt}
                      onClick={() => chooseMC(opt)}
                      disabled={checked}
                      className={clsx(
                        'flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors',
                        !checked
                          ? 'border-gray-200 bg-surface text-gray-800 hover:border-brand-300 hover:bg-brand-50/40'
                          : isAnswer
                            ? 'border-green-400 bg-green-50 text-green-800'
                            : isChosen
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-gray-200 bg-surface text-gray-400',
                      )}
                    >
                      {opt}
                      {checked && isAnswer && <Check size={15} className="shrink-0 text-green-600" />}
                      {checked && isChosen && !isAnswer && <X size={15} className="shrink-0 text-red-500" />}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-surface p-6 text-center">
                {correctObj.partOfSpeech && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {t('ss.q.parseThis', { pos: correctObj.partOfSpeech })}
                  </p>
                )}
                <p dir={hebrew ? 'rtl' : undefined} className={clsx(hebrew ? 'font-hebrew' : 'font-greek', 'text-3xl text-gray-900')}>
                  {surface}
                </p>
                {note && <p className="mt-1.5 text-sm text-gray-500">{note}</p>}
                {q.reference && <p className="mt-0.5 text-xs text-gray-400">{q.reference}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activeFields.map(([field, { label, opts }]) => {
                  const right = checked && draft[field] === correctObj[field]
                  const wrong = checked && !right
                  return (
                    <label key={field} className="block">
                      <span className={clsx(
                        'mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide',
                        right ? 'text-green-600' : wrong ? 'text-red-500' : 'text-gray-400',
                      )}>
                        {label}
                        {right && <Check size={11} />}
                        {wrong && <X size={11} />}
                      </span>
                      <select
                        value={draft[field] ?? ''}
                        onChange={e => setDraft(prev => ({ ...prev, [field]: e.target.value }))}
                        disabled={checked}
                        className={clsx(
                          'w-full rounded-lg border px-2 py-1.5 text-sm bg-surface',
                          right ? 'border-green-400 text-green-700' : wrong ? 'border-red-300 text-red-600' : 'border-gray-300 text-gray-800',
                        )}
                      >
                        <option value="">—</option>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {wrong && (
                        <span className="mt-0.5 block text-xs font-medium text-green-700">{correctObj[field]}</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </>
          )}

          <div className="flex justify-end">
            {!checked && !isMC ? (
              <button
                onClick={checkParse}
                disabled={!requiredFilled}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
              >
                {t('quiz.checkAnswer')}
              </button>
            ) : checked ? (
              <button
                onClick={next}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {t('quiz.next')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
