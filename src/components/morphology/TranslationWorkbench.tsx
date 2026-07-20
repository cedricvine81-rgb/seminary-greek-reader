'use client'

import { useEffect, useState } from 'react'
import { X, Check, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { Select } from '@/components/ui/Select'
import { ALL_SYNTAX_OPTIONS } from '@/data/syntax-categories'
import {
  registerTranslationWorkbench,
  type WorkbenchSentence,
} from '@/lib/translation-workbench-bus'

// The Grammar page's Translation Workbench: a side panel (fullscreen on mobile,
// docked right on desktop — same overlay mechanism as the Master Search pane).
// A practice sentence opens here; the student clicks each word and enters its
// parsing, syntax category, and translation, then checks against the model
// answers, and finally translates the whole sentence. Self-check only — nothing
// is submitted or graded.

interface WordEntry {
  parsing: string
  syntax: string
  gloss: string
  checked: boolean
}

const emptyEntry = (): WordEntry => ({ parsing: '', syntax: '', gloss: '', checked: false })

// ALL_SYNTAX_OPTIONS repeats "Genitive Absolute" (it lives under both genitive
// and participle uses) — dedupe so <option> keys stay unique.
const SYNTAX_OPTS = Array.from(new Set(ALL_SYNTAX_OPTIONS)).map(o => ({ value: o, label: o }))

export function TranslationWorkbench() {
  const [sentence, setSentence] = useState<WorkbenchSentence | null>(null)
  const [entries, setEntries] = useState<WordEntry[]>([])
  const [selected, setSelected] = useState(0)
  const [sentenceTr, setSentenceTr] = useState('')
  const [showModel, setShowModel] = useState(false)

  useEffect(() => {
    registerTranslationWorkbench(s => {
      setSentence(s)
      setEntries(s.words.map(emptyEntry))
      setSelected(0)
      setSentenceTr('')
      setShowModel(false)
    })
    return () => registerTranslationWorkbench(null)
  }, [])

  useEffect(() => {
    if (!sentence) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSentence(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sentence])

  // While open, publish the panel on <html> so globals.css shifts #app-content left by the
  // panel width on desktop — the grammar page sits beside the panel instead of being hidden
  // under it (the same split-view trick as the Master Search panel). Mobile is a full sheet.
  useEffect(() => {
    if (!sentence) return
    const root = document.documentElement
    root.setAttribute('data-workbench-panel', '1')
    root.style.setProperty('--workbench-panel-w', '30rem') // keep in sync with lg:w-[30rem] below
    return () => {
      root.removeAttribute('data-workbench-panel')
      root.style.removeProperty('--workbench-panel-w')
    }
  }, [sentence])

  if (!sentence) return null

  const word = sentence.words[selected]
  const entry = entries[selected] ?? emptyEntry()
  const doneCount = entries.filter(e => e.checked).length

  function update(patch: Partial<WordEntry>) {
    setEntries(prev => prev.map((e, i) => (i === selected ? { ...e, ...patch } : e)))
  }

  function reset() {
    if (!sentence) return
    setEntries(sentence.words.map(emptyEntry))
    setSelected(0)
    setSentenceTr('')
    setShowModel(false)
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:right-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[30rem] flex flex-col bg-gray-50 border-l border-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Translation workbench</p>
          {sentence.lesson && <p className="truncate text-xs text-gray-500">{sentence.lesson}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={reset}
            title="Start over"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={() => setSentence(null)}
            title="Close"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* The sentence, one chip per word */}
        <div>
          <p className="mb-2 text-xs text-gray-500">
            Click each word, enter its parsing, syntax and translation, then check your answer.
            <span className="ml-1 text-gray-400">{doneCount}/{sentence.words.length} checked</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sentence.words.map((w, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={clsx(
                  'font-reading rounded-lg border px-2.5 py-1.5 text-lg leading-none transition-colors',
                  i === selected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : entries[i]?.checked
                      ? 'border-green-300 bg-green-50 text-gray-800'
                      : 'border-gray-200 bg-surface text-gray-800 hover:border-brand-300'
                )}
              >
                {w.w}
                {entries[i]?.checked && (
                  <Check size={11} className={clsx('ml-1 inline-block', i === selected ? 'text-white' : 'text-green-600')} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Entry form for the selected word */}
        <div className="rounded-xl border border-gray-200 bg-surface p-4 space-y-3">
          <p className="font-reading text-xl text-gray-900">{word.w}</p>

          {word.parsing !== undefined && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Parsing</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Pres Act Ind 1 Pl — πιστεύω"
                value={entry.parsing}
                onChange={e => update({ parsing: e.target.value, checked: false })}
              />
              {entry.checked && (
                <p className="mt-1 border-l-2 border-brand-300 pl-2 text-sm text-gray-700">{word.parsing}</p>
              )}
            </div>
          )}

          {word.syntax !== undefined && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Syntax</label>
              <Select
                value={entry.syntax}
                onChange={e => update({ syntax: e.target.value, checked: false })}
                placeholder="Select syntax category…"
                options={SYNTAX_OPTS}
              />
              {entry.checked && (
                <p className="mt-1 border-l-2 border-brand-300 pl-2 text-sm text-gray-700">
                  {word.syntax}
                  {entry.syntax && (
                    entry.syntax === word.syntax
                      ? <span className="ml-1.5 text-xs font-medium text-green-600">✓ correct</span>
                      : <span className="ml-1.5 text-xs text-amber-600">you chose: {entry.syntax}</span>
                  )}
                </p>
              )}
            </div>
          )}

          {word.gloss !== undefined && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Translation</label>
              <input
                type="text"
                className={inputCls}
                placeholder="Translate this word…"
                value={entry.gloss}
                onChange={e => update({ gloss: e.target.value, checked: false })}
              />
              {entry.checked && (
                <p className="mt-1 border-l-2 border-brand-300 pl-2 text-sm text-gray-700">{word.gloss}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => update({ checked: true })}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              Check word
            </button>
            {selected < sentence.words.length - 1 && (
              <button
                type="button"
                onClick={() => setSelected(s => s + 1)}
                className="rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700"
              >
                Next word →
              </button>
            )}
          </div>
        </div>

        {/* Whole-sentence translation */}
        <div className="rounded-xl border border-gray-200 bg-surface p-4 space-y-2">
          <label className="block text-xs font-medium text-gray-600">Now translate the whole sentence</label>
          <textarea
            rows={2}
            className={inputCls}
            placeholder="Enter your translation…"
            value={sentenceTr}
            onChange={e => setSentenceTr(e.target.value)}
          />
          {showModel ? (
            <div className="border-l-2 border-brand-300 pl-3">
              <p className="text-sm font-medium text-gray-900">{sentence.translation}</p>
              {sentence.note && <p className="mt-0.5 text-xs text-gray-500">{sentence.note}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModel(true)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              Show model translation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
