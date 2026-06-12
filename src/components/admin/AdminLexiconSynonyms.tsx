'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useApi } from '@/lib/api-client'
import { Check, X } from 'lucide-react'

interface LexRow {
  id: string
  lexeme: string
  gloss: string
  extendedGloss: string | null
  partOfSpeech: string
  frequency: number
  acceptedAnswers: string | null
}

interface LexResponse {
  rows: LexRow[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Greek alphabet for the index strip. Clicking a letter filters by that lemma start.
const GREEK_LETTERS = ['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','σ','τ','υ','φ','χ','ψ','ω']

export function AdminLexiconSynonyms() {
  const [q, setQ] = useState('')
  const [onlyWithSynonyms, setOnlyWithSynonyms] = useState(false)
  // Default ON — by far the most useful working set (your published quiz vocab)
  const [quizVocabOnly, setQuizVocabOnly] = useState(true)
  const [alphaStart, setAlphaStart] = useState('')
  const [sort, setSort] = useState<'freq' | 'alpha'>('alpha')
  const [minFreq, setMinFreq] = useState(0)
  const [page, setPage] = useState(1)
  const [editId, setEditId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (onlyWithSynonyms) params.set('onlyWithSynonyms', '1')
  if (quizVocabOnly) params.set('quizVocabOnly', '1')
  if (alphaStart) params.set('alphaStart', alphaStart)
  if (sort) params.set('sort', sort)
  if (minFreq > 0) params.set('minFreq', String(minFreq))
  params.set('page', String(page))

  const { data, isLoading, mutate } = useApi<LexResponse>(`/api/admin/lexicon?${params.toString()}`)

  function startEdit(row: LexRow) {
    setEditId(row.id)
    setEditValue(row.acceptedAnswers ?? '')
    setError('')
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/lexicon/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedAnswers: editValue }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error ?? 'Save failed'); return }
      setEditId(null)
      mutate()
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <CardTitle>Vocab Synonyms</CardTitle>
        <span className="text-xs text-gray-500">
          {data && `${data.total} lemmas`}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Add English glosses you'd like the grader to accept for each Greek lemma in addition to the quiz's official answer.
        Enter as a comma-separated list (e.g. <code>preach, herald, announce</code>). Applies to <strong>future</strong> quiz
        submissions — past student scores are not changed.
      </p>

      {/* A–Z letter index — click a letter to jump to lemmas starting with it. Tip: you don't need to type Greek. */}
      <div className="mb-3 flex items-center gap-1 flex-wrap text-sm">
        <button
          onClick={() => { setAlphaStart(''); setPage(1) }}
          className={`px-2 py-0.5 rounded ${alphaStart === '' ? 'bg-brand-100 text-brand-800 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          All
        </button>
        {GREEK_LETTERS.map(letter => (
          <button
            key={letter}
            onClick={() => { setAlphaStart(letter); setPage(1) }}
            className={`px-2 py-0.5 rounded font-greek ${alphaStart === letter ? 'bg-brand-100 text-brand-800 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <Input
          label="Search (English or Greek)"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
          placeholder='e.g. "proclaim"'
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
          <select
            className="input w-full"
            value={sort}
            onChange={e => { setSort(e.target.value as 'freq' | 'alpha'); setPage(1) }}
          >
            <option value="alpha">Alphabetical (Greek)</option>
            <option value="freq">Frequency (most common first)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min. frequency</label>
          <select
            className="input w-full"
            value={minFreq}
            onChange={e => { setMinFreq(Number(e.target.value)); setPage(1) }}
          >
            <option value={0}>All (any frequency)</option>
            <option value={50}>50+ (Beginning vocab)</option>
            <option value={30}>30+ (Intermediate vocab)</option>
            <option value={10}>10+ (broader)</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button size="sm" variant="ghost" onClick={() => mutate()}>Refresh</Button>
        </div>
      </div>

      <div className="flex items-center gap-5 mb-4 text-sm text-gray-700 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={quizVocabOnly}
            onChange={e => { setQuizVocabOnly(e.target.checked); setPage(1) }}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Only show words used in your <strong>published vocab quizzes</strong></span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyWithSynonyms}
            onChange={e => { setOnlyWithSynonyms(e.target.checked); setPage(1) }}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Only show entries that already have synonyms
        </label>
      </div>

      {isLoading && <p className="text-sm text-gray-400 animate-pulse">Loading lexicon…</p>}

      {data && data.rows.length === 0 && (
        <p className="text-sm text-gray-400 italic py-4">No lexemes match these filters.</p>
      )}

      {data && data.rows.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 pr-3">Lemma</th>
                  <th className="pb-2 pr-3">Primary gloss</th>
                  <th className="pb-2 pr-3 text-right">Freq.</th>
                  <th className="pb-2 pr-3">Accepted synonyms</th>
                  <th className="pb-2 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 align-top">
                    <td className="py-2 pr-3">
                      <span className="font-greek text-lg text-gray-800">{row.lexeme}</span>
                      <div className="text-[10px] text-gray-400">{row.partOfSpeech}</div>
                    </td>
                    <td className="py-2 pr-3 text-gray-700 max-w-[280px]">
                      {row.gloss}
                      {row.extendedGloss && <div className="text-xs text-gray-400 italic mt-0.5">{row.extendedGloss}</div>}
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-500 text-xs">{row.frequency}</td>
                    <td className="py-2 pr-3">
                      {editId === row.id ? (
                        <input
                          autoFocus
                          className="input w-full"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="e.g. preach, herald, announce"
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit()
                            else if (e.key === 'Escape') setEditId(null)
                          }}
                        />
                      ) : row.acceptedAnswers ? (
                        <div className="flex flex-wrap gap-1">
                          {row.acceptedAnswers.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                            <Badge key={s} variant="green">{s}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">none</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editId === row.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={saveEdit} loading={saving}><Check size={13} /></Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditId(null)}><X size={13} /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => startEdit(row)}>Edit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mt-3">{error}</p>}

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">Page {data.page} of {data.totalPages} · {data.rows.length} of {data.total}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</Button>
              <Button size="sm" variant="secondary" disabled={data.page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
