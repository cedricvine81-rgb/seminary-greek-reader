'use client'
import Link from 'next/link'
import clsx from 'clsx'
import { BookOpen, Check, X } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { summarisePractice, type PracticeAnswer } from '@/lib/morph-practice-report'
import { grammarHref, type MorphLang } from '@/lib/morph-grammar-links'

// What the student sees when a PRACTICE session ends: every form they parsed, what they said,
// what it was, and a link to the chapter that teaches whatever they got wrong. Practice is
// formative — nothing here is recorded, so this report is the entire output of the session and
// has to carry its weight.

const FIELD_LABEL: Record<string, string> = {
  tense: 'morph.tense', voice: 'morph.voice', mood: 'morph.mood', person: 'morph.person',
  number: 'morph.number', casus: 'morph.case', gender: 'morph.gender',
  pronounType: 'quiz.pronounType', type: 'quiz.pronounType',
  stem: 'morph.stem', conjugation: 'morph.conjugation', state: 'morph.state',
}

/** "surface  (lexeme — gloss)" → just the form, which is what the table column wants. */
function surfaceOf(prompt: string): string {
  return prompt.match(/^(\S+)\s\s\(/)?.[1] ?? prompt
}

export function MorphPracticeReport({ answers, lang, level = 'beginning' }: {
  answers: PracticeAnswer[]
  lang: MorphLang
  level?: 'beginning' | 'intermediate'
}) {
  const t = useT()
  const report = summarisePractice(answers)
  const hebrew = lang === 'hebrew'
  const pct = report.asked > 0 ? Math.round((report.right / report.asked) * 100) : 0
  const label = (f: string) => (FIELD_LABEL[f] ? t(FIELD_LABEL[f]) : f)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-surface p-6 text-center">
        <p className="text-5xl font-bold text-gray-900">{pct}%</p>
        <p className="mt-1 text-xs text-gray-400">
          {t('ss.q.fieldsRight', { correct: report.right, total: report.asked })}
        </p>
      </div>

      {/* What to work on — the actionable half. Absent when they got everything right. */}
      {report.misses.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">{t('ss.pr.workOn')}</h3>
          <ul className="mt-2 space-y-1.5">
            {report.misses.map(m => {
              // Context = a form from this session that actually carried the missed value, so
              // "Plural" on a subjunctive resolves to the verb chapter, not the noun one.
              const ctx = answers.find(a => a.correct[m.field] === m.value)?.correct
              const href = grammarHref(lang, m.field, m.value, level, ctx)
              return (
                <li key={`${m.field}-${m.value}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium text-amber-900">{m.value}</span>
                  <span className="text-amber-700">
                    {t('ss.pr.missedOf', { missed: m.missed, asked: m.asked, field: label(m.field) })}
                  </span>
                  {href && (
                    <Link href={href} className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-800">
                      <BookOpen size={13} /> {t('ss.pr.readChapter')}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Every question, so a student can see WHICH form tripped them rather than a bare score. */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-surface">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 font-medium">{t('ss.pr.form')}</th>
              <th className="px-4 py-2.5 font-medium">{t('ss.pr.yourAnswer')}</th>
              <th className="px-4 py-2.5 font-medium">{t('ss.pr.correct')}</th>
              <th className="px-4 py-2.5 font-medium">{t('ss.pr.taught')}</th>
            </tr>
          </thead>
          <tbody>
            {answers.map((a, i) => {
              const fields = Object.keys(a.correct).filter(f => a.correct[f] != null && f !== 'partOfSpeech')
              const wrong = fields.filter(f => a.given[f] !== a.correct[f])
              // Link on the first thing they got wrong: one clear next step per row beats four.
              const href = wrong.length
                ? grammarHref(lang, wrong[0], a.correct[wrong[0]] as string, level, a.correct)
                : null
              return (
                <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                  <td className={clsx('px-4 py-2.5 whitespace-nowrap', hebrew ? 'font-hebrew text-base' : 'font-reading')}>
                    <span className="inline-flex items-center gap-1.5">
                      {wrong.length === 0
                        ? <Check size={14} className="shrink-0 text-green-600" />
                        : <X size={14} className="shrink-0 text-red-500" />}
                      {surfaceOf(a.prompt)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {fields.map(f => (
                      <span key={f} className={clsx('mr-2 inline-block',
                        a.given[f] === a.correct[f] ? 'text-gray-500' : 'font-medium text-red-600')}>
                        {a.given[f] ?? '—'}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-2.5 text-gray-900">
                    {fields.map(f => (
                      <span key={f} className={clsx('mr-2 inline-block',
                        a.given[f] === a.correct[f] ? 'text-gray-400' : 'font-medium text-green-700')}>
                        {a.correct[f]}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-2.5">
                    {href
                      ? <Link href={href} className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-800">
                          <BookOpen size={13} /> {label(wrong[0])}
                        </Link>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
