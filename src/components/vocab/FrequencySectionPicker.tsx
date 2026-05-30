'use client'
import { useState } from 'react'
import { Check, ChevronRight, ChevronDown, List, X } from 'lucide-react'
import { clsx } from 'clsx'
import {
  ALL_SECTIONS,
  SECTION_SUBSECTIONS,
  SECTION_CUMULATIVE_COVERAGE,
  ALL_SUBSECTION_KEYS,
} from '@/lib/vocab-subsections'
import type { Subsection } from '@/lib/vocab-subsections'

// ── Local Checkbox ────────────────────────────────────────────────────────────

function Checkbox({
  checked, indeterminate = false, onChange,
}: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange() }}
      className={clsx(
        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        checked || indeterminate
          ? 'bg-white border-gray-300'
          : 'border-gray-300 hover:border-gray-400',
      )}
      aria-checked={indeterminate ? 'mixed' : checked}
      role="checkbox"
    >
      {checked && !indeterminate && <Check size={11} className="text-gray-700" strokeWidth={3} />}
      {indeterminate && <span className="block w-2 h-0.5 bg-gray-600 rounded-full" />}
    </button>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionListMode = 'greek-english' | 'greek' | 'english'

export interface FrequencySectionPickerProps {
  selectedSubsections: string[]
  onChange: (keys: string[]) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FrequencySectionPicker({
  selectedSubsections,
  onChange,
}: FrequencySectionPickerProps) {
  const [expandedSections, setExpandedSections] = useState<number[]>(ALL_SECTIONS)
  const [listSubKey, setListSubKey] = useState<string | null>(null)
  const [subListMode, setSubListMode] = useState<Record<string, SectionListMode>>({})

  const subSet = new Set(selectedSubsections)

  const sectionState = (s: number): 'all' | 'none' | 'partial' => {
    const keys = SECTION_SUBSECTIONS[s].map(sub => sub.key)
    const n = keys.filter(k => subSet.has(k)).length
    if (n === 0) return 'none'
    if (n === keys.length) return 'all'
    return 'partial'
  }

  const toggleSection = (s: number) => {
    const sectionKeys = SECTION_SUBSECTIONS[s].map(sub => sub.key)
    if (sectionState(s) === 'all') {
      onChange(selectedSubsections.filter(k => !sectionKeys.includes(k)))
    } else {
      onChange(Array.from(new Set([...selectedSubsections, ...sectionKeys])))
    }
  }

  const toggleSubsection = (key: string) => {
    onChange(subSet.has(key)
      ? selectedSubsections.filter(k => k !== key)
      : [...selectedSubsections, key],
    )
  }

  const toggleExpand = (s: number) => {
    setExpandedSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Frequency Sections
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange([...ALL_SUBSECTION_KEYS])}
            className="text-sm text-gray-700 hover:underline font-medium"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-1.5">
        {ALL_SECTIONS.map(s => {
          const state = sectionState(s)
          const isExpanded = expandedSections.includes(s)
          const subs = SECTION_SUBSECTIONS[s]
          const coverage = SECTION_CUMULATIVE_COVERAGE[s]

          return (
            <div
              key={s}
              className="rounded-lg border overflow-hidden transition-colors border-gray-200"
            >
              {/* Section row */}
              <div className="flex items-center px-4 py-3 gap-3 bg-white">
                <Checkbox
                  checked={state === 'all'}
                  indeterminate={state === 'partial'}
                  onChange={() => toggleSection(s)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-base font-medium text-gray-900">Section §{s}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {subs.reduce((n, sub) => n + sub.words.length, 0)} words · up to {coverage}% GNT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleExpand(s)}
                  className="p-0.5 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>

              {/* Subsection chips */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white space-y-3">
                  <div className="grid grid-cols-8 gap-2">
                    {subs.map(sub => {
                      const isSubSelected = subSet.has(sub.key)
                      const isListed = listSubKey === sub.key
                      return (
                        <div key={sub.key} className="flex flex-col gap-1">
                          {/* Selection chip */}
                          <button
                            type="button"
                            onClick={() => toggleSubsection(sub.key)}
                            className={clsx(
                              'flex flex-col items-center justify-center py-2.5 rounded-lg border text-center transition-colors',
                              isSubSelected
                                ? 'bg-gray-100 border-gray-300 text-gray-900'
                                : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900',
                            )}
                          >
                            <span className="text-base font-semibold leading-none">{sub.label}</span>
                            <span className={clsx(
                              'text-xs mt-1 leading-none',
                              isSubSelected ? 'text-gray-600' : 'text-gray-500',
                            )}>
                              {sub.rankRange}
                            </span>
                          </button>
                          {/* Word-list toggle */}
                          <button
                            type="button"
                            onClick={() => setListSubKey(isListed ? null : sub.key)}
                            title={`View ${sub.label} word list`}
                            className={clsx(
                              'flex items-center justify-center py-1 rounded border text-center transition-colors',
                              isListed
                                ? 'border-gray-200 bg-gray-50 text-gray-700'
                                : 'border-gray-200 text-gray-500 hover:text-gray-700',
                            )}
                          >
                            <List size={11} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Inline word list for the active subsection in this section */}
                  {listSubKey && subs.some(sub => sub.key === listSubKey) && (() => {
                    const sub = subs.find(sub => sub.key === listSubKey)!
                    const mode: SectionListMode = subListMode[sub.key] ?? 'greek-english'
                    const setMode = (m: SectionListMode) =>
                      setSubListMode(prev => ({ ...prev, [sub.key]: m }))
                    const cols = mode === 'greek-english' ? 2 : 3
                    return (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        {/* List header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-700">
                            §{s}{sub.label} · Words {sub.rankRange}
                            <span className="text-gray-400 font-normal ml-1.5">
                              ({sub.words.length} words)
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            {/* Mode toggle */}
                            <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
                              {(['greek-english', 'greek', 'english'] as const).map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setMode(m)}
                                  className={clsx(
                                    'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                                    mode === m
                                      ? 'bg-white text-gray-900 shadow-sm'
                                      : 'text-gray-400 hover:text-gray-600',
                                  )}
                                >
                                  {m === 'greek-english' ? 'Greek-English' : m === 'greek' ? 'Greek' : 'English'}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setListSubKey(null)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                        {/* Word rows */}
                        <div className={mode === 'greek-english' ? 'grid grid-cols-2' : 'grid grid-cols-3'}>
                          {sub.words.map((w, i) => (
                            <div
                              key={w.word}
                              className={clsx(
                                'px-4 py-2.5',
                                i % cols !== cols - 1 ? 'border-r border-gray-100' : '',
                                i < sub.words.length - cols ? 'border-b border-gray-100' : '',
                              )}
                            >
                              {mode === 'greek-english' && (
                                <div className="flex items-baseline justify-between gap-2 min-w-0">
                                  <div className="min-w-0 flex-1 truncate">
                                    <span className="greek-text text-base font-semibold text-gray-900">{w.word}</span>
                                    {w.inflection && (
                                      <span className="greek-text text-xs text-gray-400 ml-1">{w.inflection}</span>
                                    )}
                                    <span className="text-sm text-gray-600 ml-1.5">{w.gloss}</span>
                                  </div>
                                </div>
                              )}
                              {mode === 'greek' && (
                                <div className="flex items-baseline gap-1.5 min-w-0">
                                  <span className="greek-text text-base font-semibold text-gray-900">{w.word}</span>
                                  {w.inflection && (
                                    <span className="greek-text text-xs text-gray-400">{w.inflection}</span>
                                  )}
                                </div>
                              )}
                              {mode === 'english' && (
                                <span className="text-sm text-gray-700">{w.gloss}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
