'use client'
import { useState } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { Check, ChevronRight, ChevronDown, List, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useNarrowScreen } from '@/lib/use-narrow-screen'
import { bandForSection, BAND_LEGEND, freqRange } from '@/lib/vocab-bands'
import { DECKS, type VocabLang } from '@/lib/vocab-decks'
import type { Subsection } from '@/lib/vocab-subsections'
import { useDeckGloss } from '@/lib/use-deck-gloss'

/**
 * Band labels via LITERAL t() keys, not `t(`vocab.band.${band}.short`)`. A template-literal key
 * is invisible to `npm run i18n:keys`, so a missing one would print the key on screen with every
 * check green — the exact failure that guard exists to catch.
 */
function useBandLabels() {
  const t = useT()
  return {
    name: (b: string) => b === 'BEGINNING' ? t('vocab.band.BEGINNING.name')
      : b === 'INTERMEDIATE' ? t('vocab.band.INTERMEDIATE.name') : t('vocab.band.BEYOND.name'),
    short: (b: string) => b === 'BEGINNING' ? t('vocab.band.BEGINNING.short')
      : b === 'INTERMEDIATE' ? t('vocab.band.INTERMEDIATE.short') : t('vocab.band.BEYOND.short'),
    freq: (b: string) => b === 'BEGINNING' ? t('vocab.band.BEGINNING.freq')
      : b === 'INTERMEDIATE' ? t('vocab.band.INTERMEDIATE.freq') : t('vocab.band.BEYOND.freq'),
  }
}

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
          ? 'bg-surface border-gray-300'
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
  /**
   * Which deck to pick sections from. Defaults to Greek so existing callers are unchanged.
   * A Hebrew course must pass 'hebrew', or the instructor is offered the BGVB sections and
   * the generated quiz would be Greek.
   */
  lang?: VocabLang
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FrequencySectionPicker({
  selectedSubsections,
  onChange,
  lang = 'greek',
}: FrequencySectionPickerProps) {
  const t = useT()
  const locale = useLocale()
  const narrow = useNarrowScreen()
  const bandL = useBandLabels()
  const deck = DECKS[lang]
  // The word lists here are the SAME deck the flashcards show, and were rendering raw
  // English for the same reason: nothing called the resolver.
  const gloss = useDeckGloss(locale, lang)
  // The Beginning/Intermediate bands are NT frequency bands — they describe which BGVB
  // sections a Greek course covers. The Hebrew deck's sections mean something else, so the
  // band legend and chips are Greek-only rather than mislabelled.
  const showBands = lang === 'greek'
  const [expandedSections, setExpandedSections] = useState<number[]>(deck.sections)
  const [listSubKey, setListSubKey] = useState<string | null>(null)
  const [subListMode, setSubListMode] = useState<Record<string, SectionListMode>>({})

  const subSet = new Set(selectedSubsections)

  const sectionState = (s: number): 'all' | 'none' | 'partial' => {
    const keys = deck.subsections[s].map(sub => sub.key)
    const n = keys.filter(k => subSet.has(k)).length
    if (n === 0) return 'none'
    if (n === keys.length) return 'all'
    return 'partial'
  }

  const toggleSection = (s: number) => {
    const sectionKeys = deck.subsections[s].map(sub => sub.key)
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
          {t('vocab.frequencySections')}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange([...deck.allSubsectionKeys])}
            className="text-sm text-gray-700 hover:underline font-medium"
          >
            {t('action.all')}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t('action.clear')}
          </button>
        </div>
      </div>

      {/* Which sections belong to which course — so an instructor building a quiz can
          see at a glance where Beginning ends and Intermediate begins. */}
      {showBands && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {BAND_LEGEND.map(b => (
            <span key={b.band} className={clsx('text-xs px-2 py-0.5 rounded-full border', b.chip)}>
              {bandL.name(b.band)} · {bandL.freq(b.band)}
            </span>
          ))}
        </div>
      )}

      {/* Glanz bands — a SECOND way into the same deck, for a course that sets its weekly
          vocabulary as "Glanz 1F" rather than by our frequency sections. The two groupings
          do not line up (different frequency list), so they are offered side by side and a
          selection may mix them. Hebrew only; see scripts/build-glanz-bands.py. */}
      {deck.bands && deck.bands.length > 0 && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {t('vocab.glanzBands')}
            </p>
            <p className="text-xs text-gray-400">{t('vocab.glanzBandsHint')}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {deck.bands.map(b => {
              const on = subSet.has(b.key)
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => toggleSubsection(b.key)}
                  title={`${t('vocab.glanzRanks', { range: b.rankRange })} · ${b.words.length}`}
                  className={clsx(
                    'px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors',
                    on
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-surface border-gray-300 text-gray-600 hover:border-gray-400',
                  )}
                >
                  {b.label}
                  <span className={clsx('ml-1', on ? 'text-white/70' : 'text-gray-400')}>
                    {b.words.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Section list */}
      <div className="space-y-1.5">
        {deck.sections.map(s => {
          const state = sectionState(s)
          const isExpanded = expandedSections.includes(s)
          const subs = deck.subsections[s]
          const coverage = deck.coverage[s]
          const band = bandForSection(s)
          const sectionRange = freqRange(subs.flatMap(sub => sub.words))

          return (
            <div
              key={s}
              className={clsx('rounded-lg border overflow-hidden transition-colors border-gray-200', band.edge)}
            >
              {/* Section row */}
              <div className="flex items-center px-4 py-3 gap-3 bg-surface">
                <Checkbox
                  checked={state === 'all'}
                  indeterminate={state === 'partial'}
                  onChange={() => toggleSection(s)}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-base font-medium text-gray-900">{t('vocab.sectionN', { n: s })}</span>
                  {showBands && (
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full border ml-2 align-middle', band.chip)}>
                      {bandL.short(band.band)}
                    </span>
                  )}
                  <span className="text-sm text-gray-600 ml-2">
                    {t('vocab.wordCount', { n: subs.reduce((n, sub) => n + sub.words.length, 0) })}
                    {sectionRange && <> · {sectionRange}</>}
                    {' '}· {t('vocab.upToCoverage', { pct: coverage, corpus: t(deck.lang === 'hebrew' ? 'vocab.corpus.hebrew' : 'vocab.corpus.greek') })}
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
                <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-surface space-y-3">
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
                              // Selected sections carry the brand tint rather than a grey one step
                              // off the unselected chip: which sections are on is the whole state of
                              // this picker, and told in grey alone it was easy to misread.
                              isSubSelected
                                ? 'bg-brand-100 border-brand-400 text-brand-900 ring-1 ring-brand-300'
                                : 'bg-surface border-gray-200 text-gray-800 hover:text-gray-900',
                            )}
                          >
                            {/* The subsection code (§1-A) is what a student scans for when a quiz
                                names one, so it is set at full strength rather than muted until
                                selected — reading it was the reported difficulty. */}
                            <span className="text-base font-semibold leading-none">{sub.label}</span>
                            <span className={clsx(
                              'text-xs mt-1 leading-none',
                              isSubSelected ? 'text-brand-700' : 'text-gray-600',
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
                    // One column on a phone for word+gloss, two for the single-language lists. Two columns
                    // of ~130px each showed neither the whole Greek/Hebrew word nor its English.
                    const cols = mode === 'greek-english' ? (narrow ? 1 : 2) : (narrow ? 2 : 3)
                    return (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        {/* List header */}
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                          <p className="min-w-0 text-sm font-semibold text-gray-700">
                            §{s}{sub.label} · Words {sub.rankRange}
                            <span className="text-gray-400 font-normal ml-1.5">
                              ({sub.words.length} words)
                            </span>
                          {freqRange(sub.words) && (
                            <span className="text-gray-500 font-normal ml-1.5">· {freqRange(sub.words)}</span>
                          )}
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
                                      ? 'bg-surface text-gray-900 shadow-sm'
                                      : 'text-gray-400 hover:text-gray-600',
                                  )}
                                >
                                  {m === 'greek-english' ? `${deck.scriptName}-English` : m === 'greek' ? deck.scriptName : 'English'}
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
                        <div className={clsx('grid', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
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
                                  <div className="min-w-0 flex-1 sm:truncate">
                                    <span dir={deck.rtl ? 'rtl' : undefined} className={clsx(deck.scriptClass, 'text-base font-semibold text-gray-900')}>{w.word}</span>
                                    {w.inflection && (
                                      <span dir={deck.rtl ? 'rtl' : undefined} className={clsx(deck.scriptClass, 'text-xs text-gray-400 ml-1')}>{w.inflection}</span>
                                    )}
                                    <span className="text-sm text-gray-600 ml-1.5">{gloss(w)}</span>
                                  </div>
                                </div>
                              )}
                              {mode === 'greek' && (
                                <div className="flex items-baseline gap-1.5 min-w-0">
                                  <span dir={deck.rtl ? 'rtl' : undefined} className={clsx(deck.scriptClass, 'text-base font-semibold text-gray-900')}>{w.word}</span>
                                  {w.inflection && (
                                    <span dir={deck.rtl ? 'rtl' : undefined} className={clsx(deck.scriptClass, 'text-xs text-gray-400')}>{w.inflection}</span>
                                  )}
                                </div>
                              )}
                              {mode === 'english' && (
                                <span className="text-sm text-gray-700">{gloss(w)}</span>
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
