'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { morphQuizFor, morphKeyFor, MORPH_PASS_PCT, MORPH_QUIZ_QUESTIONS } from '@/lib/self-study-morph'
import { drillFilter, type ValueMiss, type PracticeAnswer } from '@/lib/morph-practice-report'
import {
  fieldsFor, isParsePool, normaliseSubtype, type CustomMorphSpec,
} from '@/lib/morph-practice-custom'
import { acceptableParses, bestReading } from '@/lib/morph-ambiguity'
import { MORPH_OPTIONS } from '@/data/morphology-options'
import { MorphPracticeReport } from '@/components/student/MorphPracticeReport'
import {
  POOL_STEMS, POOL_CONJUGATIONS, POOL_PERSONS, POOL_GENDERS, POOL_NUMBERS,
  POOL_STATES, POOL_PRONOUN_TYPES,
} from '@/lib/quiz-fields-hebrew'

// Auto-graded parsing practice for a self-study lesson. Questions are generated
// server-side (/api/self-study/morph) from the instructor-quiz corpus pools — fresh forms
// every attempt — and graded here, field by field. Scoring is per parsing field, not per
// form (four of five fields right is 80%, not zero); reaching MORPH_PASS_PCT of the
// fields records the lesson's morph-step key in the shared progress store.

/** Thrown to abandon a load whose result is no longer the one being waited for. */
class StaleLoad extends Error {}

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

// Three sources, one quiz. Self-study passes `trackId`/`lessonNo` and the ladder in
// self-study-morph.ts supplies the recipe; an enrolled student passes `assignmentId` and the
// recipe is the one their instructor stored on the assignment; the custom builder passes a
// `custom` spec the student wrote themselves. In every case the forms are generated fresh
// server-side, so practice is never a rehearsal of the answer key.
//
// `practice` runs the same questions FORMATIVELY: nothing is recorded, and the end of the
// session shows the per-question report with links into the grammar instead of a bare score.
// Assignment practice is always formative — there is no lesson step for it to record.
export function PracticeMorphQuiz({
  trackId, lessonNo, assignmentId, custom, onExit, embedded, practice = false, backTo,
}: {
  trackId?: string
  lessonNo?: number
  assignmentId?: string
  /** A drill the student built (or a "drill these" narrowing of one they just ran). */
  custom?: CustomMorphSpec
  /** Custom mode's way back — there is no page to link to, the builder is right here. */
  onExit?: () => void
  embedded?: boolean
  practice?: boolean
  /** Where "back" goes when the student arrived from somewhere other than their own track —
   *  a grammar chapter, say. Validated by the page; this component only renders it. */
  backTo?: { href: string; labelKey: string }
}) {
  const t = useT()
  const fromAssignment = !!assignmentId
  const def = trackId && lessonNo != null ? morphQuizFor(trackId, lessonNo) : null
  const stepKey = trackId && lessonNo != null ? morphKeyFor(trackId, lessonNo) : ''
  const { completed, setChapter } = useCourseProgress()

  const [questions, setQuestions] = useState<MorphQ[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<Record<string, string>>({})
  // Practice transcript: one entry per graded question, used only for the end report.
  const [answers, setAnswers] = useState<PracticeAnswer[]>([])
  // Assignment mode: language, title and caveats come back with the questions, since there is
  // no lesson definition to read them from.
  const [meta, setMeta] = useState<{
    lang: 'greek' | 'hebrew'; title: string; vocabCapped: boolean; approximate: boolean
    /** Enough of the recipe for "drill these" to rebuild the same KIND of quiz. */
    subtype?: string; fields?: string[]
    vocabThruLesson?: number | null; vocabThruBand?: string | null
  } | null>(null)
  // Which READING the answer was graded against. A form is often several parses at once —
  // πνεῦμα is nominative or accusative, a plural nominative is also the vocative — so the marks,
  // the green hint under a select and the end-of-session report all have to speak about the
  // reading the student was actually credited for, not the one the corpus happened to store.
  const [reading, setReading] = useState<Record<string, string | null> | null>(null)
  const [checked, setChecked] = useState(false)
  const [earned, setEarned] = useState(0)
  const [possible, setPossible] = useState(0)
  // "Drill these" narrows the session that just ended into a new custom spec — which is why
  // every mode can end in one: the report's output IS a filter the generator accepts.
  const [drill, setDrill] = useState<CustomMorphSpec | null>(null)
  const [drilling, setDrilling] = useState(false)
  // No forms matched even the widest narrowing — say so rather than start a quiz of nothing.
  const [drillEmpty, setDrillEmpty] = useState(false)

  // Keyed by CONTENT, not identity: `custom` is a prop, and a caller passing an object literal
  // would otherwise hand `load` a new dependency on every render and refetch for ever.
  const specKey = JSON.stringify(drill ?? custom ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spec = useMemo(() => drill ?? custom ?? null, [specKey])

  // Only the newest load may write: "Try again" and a drill both reload, and a slow earlier
  // response must not land on top of the quiz the student is now answering.
  const loadSeq = useRef(0)

  const load = useCallback(() => {
    const mine = ++loadSeq.current
    setQuestions(null)
    setFailed(false)
    setIdx(0)
    setDraft({})
    setAnswers([])
    setChecked(false)
    setReading(null)
    setEarned(0)
    setPossible(0)
    setMeta(null)
    setDrilling(false)
    setDrillEmpty(false)
    const req: Promise<Response> = spec
      ? fetch('/api/practice/morph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...spec, count: MORPH_QUIZ_QUESTIONS }),
        })
      : fetch(assignmentId
          ? `/api/assignments/${assignmentId}/practice`
          : `/api/self-study/morph?track=${trackId}&lesson=${lessonNo}`)
    req
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(data => { if (mine !== loadSeq.current) throw new StaleLoad(); return data })
      .then((data: { questions?: MorphQ[]; lang?: 'greek' | 'hebrew'; title?: string;
        vocabCapped?: boolean; approximate?: boolean; subtype?: string; fields?: string[]
        vocabThruLesson?: number | null; vocabThruBand?: string | null }) => {
        if (data.questions?.length) {
          setQuestions(data.questions)
          if (spec) {
            setMeta({ lang: spec.lang, title: '', vocabCapped: !!spec.vocabThruLesson, approximate: false })
          } else if (data.lang) {
            setMeta({
              lang: data.lang, title: data.title ?? '',
              vocabCapped: !!data.vocabCapped, approximate: !!data.approximate,
              subtype: data.subtype, fields: data.fields,
              vocabThruLesson: data.vocabThruLesson ?? null,
              vocabThruBand: data.vocabThruBand ?? null,
            })
          }
        } else setFailed(true)
      })
      .catch(e => { if (!(e instanceof StaleLoad)) setFailed(true) })
  }, [trackId, lessonNo, assignmentId, spec])

  useEffect(() => { load() }, [load])

  if (!def && !fromAssignment && !spec) return null
  const lang = spec?.lang ?? (fromAssignment ? (meta?.lang ?? 'greek') : def!.lang)
  const hebrew = lang === 'hebrew'
  const backHref = backTo?.href
    ?? (fromAssignment ? `/student/assignments/${assignmentId}` : `/student/self-study/${trackId}`)
  const backLabel = backTo
    ? t(backTo.labelKey)
    : fromAssignment ? t('assign.backToAssignment') : t('ss.q.backToTrack')
  const alreadyDone = !practice && !fromAssignment && !spec && !!def && completed.has(stepKey)
  const hasVocabCap = spec
    ? !!spec.vocabThruLesson
    : fromAssignment
      ? !!meta?.vocabCapped
      : def!.lang === 'greek' ? def!.vocabThruLesson != null : !!def!.vocabThruBand

  // Every source but a graded self-study attempt is formative: nothing is recorded and the
  // session ends in the report rather than a mark.
  const formative = practice || fromAssignment || !!spec

  /**
   * What a "drill these" session should be: the same kind of quiz, narrowed to what was just
   * missed. The subtype and fields come from whichever source is running — the student's own
   * spec, the assignment's stored recipe, or the self-study ladder — so the drill asks the
   * same questions about harder forms, rather than becoming a different quiz.
   */
  function drillBase(): CustomMorphSpec | null {
    if (spec) return { ...spec, parseFilter: {} }
    if (fromAssignment) {
      // Conditionals and subjunctive-use quizzes are sentence sets, not parse pools: there is
      // no filter to narrow them by, so they simply do not offer a drill.
      if (!meta?.subtype || !isParsePool(meta.subtype)) return null
      const subtype = normaliseSubtype(meta.subtype)
      return {
        lang, subtype,
        fields: meta.fields?.length ? meta.fields : fieldsFor(lang, subtype),
        parseFilter: {},
        vocabThruLesson: meta.vocabThruLesson ?? null,
        vocabThruBand: meta.vocabThruBand ?? null,
      }
    }
    if (!def) return null
    if (def.lang === 'hebrew') {
      return {
        lang: 'hebrew', subtype: def.subtype, fields: def.fields, parseFilter: {},
        vocabThruBand: def.vocabThruBand ?? null,
      }
    }
    // A Greek lesson quiz may draw on several pools (nouns + adjectives); MIXED is the one
    // subtype that covers them all. The lexeme restriction of the contract/μι quizzes cannot
    // be reproduced here, and the drill does not pretend to: it is about the missed features.
    const subtype = def.subtypes.length === 1 ? def.subtypes[0].subtype : 'MIXED'
    return {
      lang: 'greek', subtype,
      fields: def.fields?.length ? def.fields : fieldsFor('greek', subtype),
      parseFilter: {},
      vocabThruLesson: def.vocabThruLesson,
    }
  }

  /**
   * Narrow to the misses, widening until there is enough to drill.
   *
   * A full miss signature is usually far too narrow — aorist + passive + participle +
   * feminine + genitive + plural may match three forms in the whole pool — so this asks for
   * the three worst misses, counts, and drops to two and then one until the pool is usable.
   * The count endpoint is the same one the builder uses, and it never falls back, so what it
   * says is what the drill will be.
   */
  async function startDrill(misses: ValueMiss[]) {
    const base = drillBase()
    if (!base || drilling) return
    setDrilling(true)
    setDrillEmpty(false)
    let widest: { spec: CustomMorphSpec; count: number } | null = null
    for (const depth of [3, 2, 1]) {
      const candidate = { ...base, parseFilter: drillFilter(misses, depth) }
      try {
        const r = await fetch('/api/practice/morph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...candidate, count: 0 }),
        })
        if (!r.ok) throw new Error(String(r.status))
        const { count } = (await r.json()) as { count?: number }
        if ((count ?? 0) > 0) widest = { spec: candidate, count: count! }
        // Wide enough to be worth drilling, or as wide as this can get.
        if ((count ?? 0) >= 5) break
      } catch {
        break
      }
    }
    setDrilling(false)
    // A count of zero at every depth means the fields this quiz asks for and the missed value
    // do not co-occur in the corpus. Starting anyway would deal a quiz of nothing and show
    // "couldn't load", so the report simply says there is not enough to drill.
    if (widest) setDrill(widest.spec)
    else setDrillEmpty(true)
  }

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
    // Grade against whichever reading of the form fits the answer best — the same rule, from
    // the same module, that the server's grader and the graded quiz's instant feedback use.
    const fields = activeFields.map(([f]) => f)
    const graded = bestReading(acceptableParses(q.prompt, correctObj), draft, fields).reading as
      Record<string, string | null>
    const right = fields.filter(f => draft[f] === graded[f]).length
    if (formative) {
      // The transcript records the reading credited, so the report never says "you missed
      // Accusative" about an answer it just marked right.
      setAnswers(a => [...a, { prompt: q.prompt, correct: { ...graded }, given: { ...draft } }])
    }
    setReading(graded)
    setEarned(e => e + right)
    setPossible(p => p + fields.length)
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
    setReading(null)
    // Grade on the last answer: pass records the step; a fail records nothing. Practice
    // records nothing either way — it is formative by definition.
    if (!formative && n >= questions.length && possible > 0
        && Math.round((earned / possible) * 100) >= MORPH_PASS_PCT) {
      setChapter(stepKey, true)
    }
  }

  const { surface, note } = q ? splitPrompt(q.prompt) : { surface: '', note: null }

  return (
    <div className="max-w-xl space-y-5">
      {!embedded && (onExit ? (
        <button onClick={onExit} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
          <ArrowLeft size={14} /> {t('pr.b.backToBuilder')}
        </button>
      ) : (
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
          <ArrowLeft size={14} /> {backLabel}
        </Link>
      ))}

      <div>
        <h1 className="text-lg font-bold text-gray-900">
          {/* The assignment's own title is already the page title above; repeating it here
              would say the same thing twice, so the heading names the MODE instead. */}
          {spec
            ? t(`morph.subtype.${spec.subtype}`)
            : fromAssignment
              ? t('ss.pr.practise')
              : `${t(def!.labelKey)} · ${t('ss.lessonN', { n: lessonNo! })}`}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {formative ? t('ss.pr.practiceNote') : t('ss.q.parseNote', { pass: MORPH_PASS_PCT })}
          {hasVocabCap && <span> {t('ss.q.vocabCapNote')}</span>}
          {/* Legacy assignments stored only a part of speech, so say so rather than imply
              the practice matches the quiz filter for filter. */}
          {meta?.approximate && <span> {t('ss.pr.approxNote')}</span>}
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
      ) : finished && formative ? (
        <div className="space-y-4">
          <MorphPracticeReport
            answers={answers}
            lang={lang}
            onDrill={drillBase() ? startDrill : undefined}
            drilling={drilling}
            drillEmpty={drillEmpty}
          />
          <div className="flex items-center justify-center gap-3">
            <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RotateCcw size={14} /> {t('ss.q.tryAgain')}
            </button>
            {!embedded && (onExit ? (
              <button onClick={onExit} className="inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                {t('pr.b.backToBuilder')}
              </button>
            ) : (
              <Link href={backHref} className="inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                {backLabel}
              </Link>
            ))}
          </div>
        </div>
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
              <Link href={backHref} className="inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                {backLabel}
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
                  const expected = checked && reading ? reading[field] : correctObj[field]
                  const right = checked && draft[field] === expected
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
                        <span className="mt-0.5 block text-xs font-medium text-green-700">{expected}</span>
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
