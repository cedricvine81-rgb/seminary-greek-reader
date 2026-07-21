'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { useApi } from '@/lib/api-client'
import type { HomeworkWord } from '@/data/grammar-homework'

// Grading view for grammar-homework Translation Exercises: each student's
// submitted word-by-word answers side by side with the model, with a points
// box per sentence. Saved scores flow into the gradebook via Response.score.

interface HwQuestion {
  id: string
  prompt: string
  points: number
  modelTranslation: string
  model: { words: HomeworkWord[]; note?: string } | null
}
interface HwResponse { id: string; questionId: string | null; answer: string; score: number | null }
interface HwStudent { userId: string; name: string; email: string; submittedAt: string | null; responses: HwResponse[] }
interface HwData { title: string; questions: HwQuestion[]; students: HwStudent[] }

interface StudentAnswer { words: { parsing: string; syntax: string; gloss: string }[]; translation: string }

function parseAnswer(raw: string): StudentAnswer | null {
  try {
    const a = JSON.parse(raw)
    if (a && Array.isArray(a.words)) return a
  } catch { /* ignore */ }
  return null
}

export function GrammarHomeworkGrader({ assignmentId }: { assignmentId: string }) {
  const { data, isLoading, mutate } = useApi<HwData>(`/api/assignments/${assignmentId}/homework`)
  const [openStudent, setOpenStudent] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, string>>({})   // responseId -> input value
  const [saving, setSaving] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState<string | null>(null)

  if (isLoading) return <p className="py-10 text-center text-sm text-gray-400"><Loader2 size={16} className="inline animate-spin" /> Loading…</p>
  if (!data) return <p className="py-10 text-center text-sm text-gray-400">Could not load submissions.</p>

  async function saveScore(responseId: string, max: number) {
    const raw = scores[responseId]
    const val = Number(raw)
    if (raw === undefined || raw === '' || Number.isNaN(val)) return
    setSaving(responseId)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/homework`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, score: Math.min(Math.max(val, 0), max) }),
      })
      if (res.ok) {
        setSavedFlash(responseId)
        setTimeout(() => setSavedFlash(f => (f === responseId ? null : f)), 1500)
        mutate()
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardTitle>Grade homework — {data.title}</CardTitle>
      <p className="mt-1 text-xs text-gray-500">
        Scores save per sentence and roll up to the student&rsquo;s grade in the gradebook.
      </p>

      <div className="mt-4 divide-y divide-gray-100">
        {data.students.map(s => {
          const graded = s.responses.filter(r => r.score !== null && r.score > 0).length
          const isOpen = openStudent === s.userId
          return (
            <div key={s.userId} className="py-2">
              <button
                type="button"
                onClick={() => setOpenStudent(isOpen ? null : s.userId)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">{s.name}</span>
                <span className="flex items-center gap-3 text-xs text-gray-400">
                  {s.submittedAt
                    ? <>Submitted {new Date(s.submittedAt).toLocaleDateString()} · {graded}/{data.questions.length} graded</>
                    : 'Not submitted'}
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>

              {isOpen && s.submittedAt && (
                <div className="mt-2 space-y-4 pl-2">
                  {data.questions.map((q, qi) => {
                    const r = s.responses.find(x => x.questionId === q.id)
                    const ans = r ? parseAnswer(r.answer) : null
                    return (
                      <div key={q.id} className="rounded-xl border border-gray-200 bg-surface p-3">
                        <p className="font-reading normal-case text-base text-gray-900">{qi + 1}. {q.prompt}</p>

                        {ans ? (
                          <>
                            <div className="mt-2 overflow-x-auto">
                              <table className="text-xs border-collapse min-w-full">
                                <thead>
                                  <tr className="text-left text-gray-400">
                                    <th className="pr-3 py-1 font-medium">Word</th>
                                    <th className="pr-3 py-1 font-medium">Parsing (student / model)</th>
                                    <th className="pr-3 py-1 font-medium">Syntax (student / model)</th>
                                    <th className="py-1 font-medium">Gloss (student / model)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(q.model?.words ?? []).map((w, wi) => {
                                    const sw = ans.words[wi]
                                    return (
                                      <tr key={wi} className="border-t border-gray-100 align-top">
                                        <td className="pr-3 py-1 font-reading normal-case text-sm text-gray-900 whitespace-nowrap">{w.w}</td>
                                        <td className="pr-3 py-1">
                                          <span className="text-gray-800">{sw?.parsing || <em className="text-gray-300">—</em>}</span>
                                          {w.parsing && <span className="block text-gray-400">{w.parsing}</span>}
                                        </td>
                                        <td className="pr-3 py-1">
                                          <span className={clsx(w.syntax && sw?.syntax === w.syntax ? 'text-green-700' : 'text-gray-800')}>
                                            {sw?.syntax || <em className="text-gray-300">—</em>}
                                          </span>
                                          {w.syntax && <span className="block text-gray-400">{w.syntax}</span>}
                                        </td>
                                        <td className="py-1">
                                          <span className="text-gray-800">{sw?.gloss || <em className="text-gray-300">—</em>}</span>
                                          {w.gloss && <span className="block text-gray-400">{w.gloss}</span>}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                              <p className="text-gray-800"><span className="text-xs text-gray-400 mr-1.5">Student:</span>{ans.translation || <em className="text-gray-300">no translation</em>}</p>
                              <p className="text-gray-500"><span className="text-xs text-gray-400 mr-1.5">Model:</span>{q.modelTranslation}</p>
                              {q.model?.note && <p className="mt-0.5 text-xs text-gray-400">{q.model.note}</p>}
                            </div>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-gray-400 italic">No answer recorded for this sentence.</p>
                        )}

                        {r && (
                          <div className="mt-2 flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">Score</label>
                            <input
                              type="number" min={0} max={q.points} step={0.5}
                              value={scores[r.id] ?? (r.score ?? '')}
                              onChange={e => setScores(prev => ({ ...prev, [r.id]: e.target.value }))}
                              className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                            />
                            <span className="text-xs text-gray-400">/ {q.points}</span>
                            <button
                              type="button"
                              onClick={() => saveScore(r.id, q.points)}
                              disabled={saving === r.id}
                              className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                            >
                              {saving === r.id ? 'Saving…' : 'Save'}
                            </button>
                            {savedFlash === r.id && (
                              <span className="text-xs text-green-700 inline-flex items-center gap-1"><CheckCircle2 size={12} /> Saved</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
