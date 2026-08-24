'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { useCourseProgress } from '@/components/morphology/useCourseProgress'
import { selfStudyTrack, quizStepFor } from '@/lib/self-study'
import { GREEK_DECK, HEBREW_DECK, deckWordsForSelection, type DeckWord } from '@/lib/vocab-decks'

// Auto-graded practice quiz over one self-study lesson's vocabulary. Multiple choice,
// instant feedback, no instructor and no Assignment row: questions come straight from the
// same deck the /vocab page studies. Passing (≥80%) records the lesson's quiz-step key in
// the shared progress store; failing records nothing — retakes are free and unlimited.
const PASS_PCT = 80

interface Q { word: DeckWord; options: string[]; answer: string }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(words: DeckWord[], pool: DeckWord[]): Q[] {
  return shuffled(words).map(word => {
    const seen = new Set([word.gloss])
    const distractors: string[] = []
    // Same-POS glosses first — a preposition among three nouns answers itself.
    for (const c of [...shuffled(pool.filter(w => w.pos === word.pos)), ...shuffled(pool)]) {
      if (seen.has(c.gloss)) continue
      seen.add(c.gloss)
      distractors.push(c.gloss)
      if (distractors.length === 3) break
    }
    return { word, options: shuffled([word.gloss, ...distractors]), answer: word.gloss }
  })
}

export function PracticeVocabQuiz({ trackId, lessonNo }: { trackId: string; lessonNo: number }) {
  const t = useT()
  const def = selfStudyTrack(trackId)
  const step = def ? quizStepFor(def, lessonNo) : null
  const { completed, setChapter } = useCourseProgress()

  const hebrew = step?.quiz?.deck === 'hebrew'
  const deck = hebrew ? HEBREW_DECK : GREEK_DECK
  // Review quizzes span several selection keys and cap each attempt at a random sample.
  const selections = step?.quiz ? (Array.isArray(step.quiz.selection) ? step.quiz.selection : [step.quiz.selection]) : []
  const sample = step?.quiz?.sample
  const words = useMemo(
    () => (step?.quiz ? deckWordsForSelection(deck, selections, []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selections.join(','), hebrew],
  )

  const [round, setRound] = useState(0)
  const questions = useMemo(
    () => buildQuestions(sample && sample < words.length ? shuffled(words).slice(0, sample) : words, deck.words),
    [words, deck, round, sample],
  )
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)

  if (!def || !step?.quiz) return null
  if (words.length === 0) return <p className="py-8 text-sm italic text-gray-400">{t('ss.q.noWords')}</p>

  const trackHref = `/student/self-study/${def.id}`
  const finished = idx >= questions.length
  const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0
  const passed = pct >= PASS_PCT
  const alreadyDone = completed.has(step.key)

  function choose(opt: string) {
    if (chosen !== null) return
    setChosen(opt)
    const right = opt === questions[idx].answer
    if (right) setCorrect(c => c + 1)
    setTimeout(() => {
      setChosen(null)
      const next = idx + 1
      setIdx(next)
      // Grade on the last answer: pass records the step; a fail records nothing.
      if (next >= questions.length) {
        const finalCorrect = correct + (right ? 1 : 0)
        if (Math.round((finalCorrect / questions.length) * 100) >= PASS_PCT) setChapter(step!.key, true)
      }
    }, 900)
  }

  function restart() {
    setRound(r => r + 1)
    setIdx(0)
    setChosen(null)
    setCorrect(0)
  }

  const q = questions[Math.min(idx, questions.length - 1)]

  return (
    <div className="max-w-xl space-y-5">
      <Link href={trackHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <ArrowLeft size={14} /> {t('ss.q.backToTrack')}
      </Link>

      <div>
        <h1 className="text-lg font-bold text-gray-900">{t(step.labelKey ?? 'ss.vocabQuiz')} · {t('ss.lessonN', { n: lessonNo })}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {sample
            ? t('ss.q.sampleNote', { n: Math.min(sample, words.length), total: words.length, pass: PASS_PCT })
            : t('ss.q.passNote', { pass: PASS_PCT })}
          {alreadyDone && <span className="ml-1 text-green-600 font-medium">{t('ss.q.alreadyPassed')}</span>}
        </p>
      </div>

      {finished ? (
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-6 text-center">
          <p className="text-5xl font-bold text-gray-900">{pct}%</p>
          <p className={clsx('text-sm font-medium', passed ? 'text-green-600' : 'text-amber-600')}>
            {passed ? t('ss.q.passed') : t('ss.q.notPassed', { pass: PASS_PCT })}
          </p>
          <p className="text-xs text-gray-400">{t('ss.q.rightCount', { correct, total: questions.length })}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={restart} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RotateCcw size={14} /> {t('ss.q.tryAgain')}
            </button>
            <Link href={trackHref} className="inline-flex items-center rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              {t('ss.q.backToTrack')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(idx / questions.length) * 100}%` }} />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-gray-400">{idx + 1} / {questions.length}</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-6 text-center">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t('ss.q.whatMeans')}</p>
            <p dir={hebrew ? 'rtl' : undefined} className={clsx(hebrew ? 'font-hebrew' : 'font-greek', 'text-3xl text-gray-900')}>
              {q.word.word}
            </p>
          </div>

          <div className="grid gap-2">
            {q.options.map(opt => {
              const isAnswer = opt === q.answer
              const isChosen = opt === chosen
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  disabled={chosen !== null}
                  className={clsx(
                    'flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-colors',
                    chosen === null
                      ? 'border-gray-200 bg-surface text-gray-800 hover:border-brand-300 hover:bg-brand-50/40'
                      : isAnswer
                        ? 'border-green-400 bg-green-50 text-green-800'
                        : isChosen
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-surface text-gray-400',
                  )}
                >
                  {opt}
                  {chosen !== null && isAnswer && <Check size={15} className="shrink-0 text-green-600" />}
                  {chosen !== null && isChosen && !isAnswer && <X size={15} className="shrink-0 text-red-500" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
