'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, GraduationCap, RotateCcw, ChevronRight, ChevronDown, Check, Shuffle, List, X } from 'lucide-react'
import { clsx } from 'clsx'
import { sm2, responseToQuality } from '@/lib/spaced-repetition'
import bgvbData from '@/data/bgvb-vocabulary.json'

// ── Types ────────────────────────────────────────────────────────────────────

interface BgvbWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  freq: number | null
}

interface WordProgress {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: string
  correct: number
  total: number
}

type ProgressMap = Record<string, WordProgress>
type Tab = 'study' | 'browse'
type StudyMode = 'greek-to-english' | 'english-to-greek' | 'mixed'

interface Subsection {
  key: string      // e.g. "1-A"
  label: string    // e.g. "A"
  rankRange: string // e.g. "1–20" (position within section)
  words: BgvbWord[]
}

interface StudyConfig {
  mode: StudyMode
  subsections: string[]  // selected subsection keys, e.g. ["1-A", "1-B", "2-A"]
  pos: string[]
  cardFilter: 'due' | 'all'
}

// ── Constants ────────────────────────────────────────────────────────────────

const WORDS = bgvbData as BgvbWord[]
const STORAGE_KEY = 'bgvb-progress-v1'
const ALL_SECTIONS = [1, 2, 3, 4, 5, 6, 7]
const ALL_POS = Array.from(new Set(WORDS.map(w => w.pos))).sort()

const SECTION_CUMULATIVE_COVERAGE: Record<number, number> = {
  1: 69.5, 2: 77.2, 3: 81.6, 4: 84.4, 5: 86.4, 6: 87.8, 7: 89.2,
}

const POS_LABELS: Record<string, string> = {
  Verb: 'Verb', Noun: 'Noun', Adj: 'Adjective', Adv: 'Adverb',
  Prep: 'Preposition', Conj: 'Conjunction', Pron: 'Pronoun',
  Art: 'Article', Interj: 'Interjection', Particle: 'Particle',
}

// Pre-compute subsections: 20-word chunks per section, sorted by freq desc
// WORD_SUBSECTION maps each word → its subsection key (e.g. "1-A")
const SECTION_SUBSECTIONS: Record<number, Subsection[]> = {}
const WORD_SUBSECTION: Record<string, string> = {}

ALL_SECTIONS.forEach(s => {
  const sectionWords = [...WORDS.filter(w => w.section === s)]
    .sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0))
  const subs: Subsection[] = []
  for (let i = 0; i < sectionWords.length; i += 20) {
    const chunk = sectionWords.slice(i, i + 20)
    const label = String.fromCharCode(65 + subs.length) // A, B, C…
    const start = i + 1
    const end = Math.min(i + 20, sectionWords.length)
    const key = `${s}-${label}`
    subs.push({ key, label, rankRange: `${start}–${end}`, words: chunk })
    chunk.forEach(w => { WORD_SUBSECTION[w.word] = key })
  }
  SECTION_SUBSECTIONS[s] = subs
})

const ALL_SUBSECTION_KEYS = ALL_SECTIONS.flatMap(s => SECTION_SUBSECTIONS[s].map(sub => sub.key))

const DEFAULT_CONFIG: StudyConfig = {
  mode: 'greek-to-english',
  subsections: [...ALL_SUBSECTION_KEYS],
  pos: [...ALL_POS],
  cardFilter: 'due',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function isDue(p: WordProgress) {
  return p.dueDate <= todayStr()
}

function loadProgress(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

function saveProgress(p: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

function filterWords(words: BgvbWord[], config: StudyConfig, progress: ProgressMap, today: string): BgvbWord[] {
  const subSet = new Set(config.subsections)
  return words.filter(w => {
    if (!subSet.has(WORD_SUBSECTION[w.word] ?? '')) return false
    if (!config.pos.includes(w.pos)) return false
    if (config.cardFilter === 'due') {
      const p = progress[w.word]
      return !p || p.dueDate <= today
    }
    return true
  })
}

// ── Main component ───────────────────────────────────────────────────────────

export function VocabBuilder() {
  const [tab, setTab] = useState<Tab>('study')
  const [progress, setProgress] = useState<ProgressMap>({})

  useEffect(() => { setProgress(loadProgress()) }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['study', 'browse'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              tab === t ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t === 'study' && <GraduationCap size={14} />}
            {t === 'browse' && <Search size={14} />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'study' && (
        <StudyView allWords={WORDS} progress={progress} onProgress={setProgress} />
      )}
      {tab === 'browse' && <BrowseView progress={progress} />}
    </div>
  )
}

// ── Study view ───────────────────────────────────────────────────────────────

function StudyView({
  allWords, progress, onProgress,
}: {
  allWords: BgvbWord[]
  progress: ProgressMap
  onProgress: (p: ProgressMap) => void
}) {
  const [config, setConfig] = useState<StudyConfig>(DEFAULT_CONFIG)
  const [sessionWords, setSessionWords] = useState<BgvbWord[] | null>(null)
  const [directions, setDirections] = useState<boolean[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  const today = todayStr()

  const previewWords = useMemo(
    () => filterWords(allWords, config, progress, today),
    [allWords, config, progress, today]
  )

  const startStudying = (shuffle = false) => {
    let words = filterWords(allWords, config, progress, today)
    if (shuffle) words = [...words].sort(() => Math.random() - 0.5)
    const dirs = words.map(() => {
      if (config.mode === 'greek-to-english') return true
      if (config.mode === 'english-to-greek') return false
      return Math.random() > 0.5
    })
    setSessionWords(words)
    setDirections(dirs)
    setIdx(0)
    setFlipped(false)
    setFinished(false)
    setSessionStats({ correct: 0, total: 0 })
  }

  const goBack = () => { setSessionWords(null); setFinished(false) }

  if (sessionWords === null) {
    return (
      <StudySettings
        config={config}
        onChange={setConfig}
        cardCount={previewWords.length}
        onStart={() => startStudying(false)}
        onShuffle={() => startStudying(true)}
      />
    )
  }

  if (sessionWords.length === 0) {
    return (
      <div className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <p className="text-xl font-semibold text-brand-700">No cards match</p>
        <p className="text-gray-500 text-sm">Try switching to "All words" or adjust your filters.</p>
        <button onClick={goBack} className="btn btn-secondary text-sm mt-2">← Back to settings</button>
      </div>
    )
  }

  const word = sessionWords[idx]
  const greekFirst = directions[idx] ?? true

  if (finished) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-2xl font-bold text-brand-700">Session Complete!</p>
        <p className="text-gray-600">
          {sessionStats.correct} correct · {sessionStats.total - sessionStats.correct} incorrect out of {sessionStats.total}
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn btn-secondary" onClick={goBack}>← Settings</button>
          <button
            className="btn btn-primary"
            onClick={() => { setIdx(0); setFlipped(false); setFinished(false); setSessionStats({ correct: 0, total: 0 }) }}
          >
            Review Again
          </button>
        </div>
      </div>
    )
  }

  if (!word) return null

  const advance = (knew: boolean) => {
    const prev = progress[word.word]
    const result = sm2({
      easeFactor: prev?.easeFactor ?? 2.5,
      interval: prev?.interval ?? 1,
      repetitions: prev?.repetitions ?? 0,
      quality: responseToQuality(knew),
    })
    const updated: ProgressMap = {
      ...progress,
      [word.word]: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        dueDate: result.nextReviewDate.toISOString().slice(0, 10),
        correct: (prev?.correct ?? 0) + (knew ? 1 : 0),
        total: (prev?.total ?? 0) + 1,
      },
    }
    saveProgress(updated)
    onProgress(updated)
    setSessionStats(s => ({ correct: s.correct + (knew ? 1 : 0), total: s.total + 1 }))
    if (idx + 1 >= sessionWords.length) {
      setFinished(true)
    } else {
      setIdx(i => i + 1)
      setFlipped(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={goBack} className="text-xs text-gray-400 hover:text-brand-600 transition-colors mb-1 block">
            ← Settings
          </button>
          <p className="text-sm text-gray-500">Card {idx + 1} of {sessionWords.length}</p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">§{word.section}</span>
      </div>

      <div
        className="cursor-pointer select-none"
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(f => !f)}
        aria-label="Flip card"
      >
        {!flipped ? (
          <div className="bg-white rounded-2xl min-h-56 flex flex-col items-center justify-center p-10 shadow-md border-2 border-brand-700">
            <p className="text-xs font-semibold tracking-widest text-brand-500 mb-4 uppercase">
              {greekFirst ? 'Greek' : 'English'}
            </p>
            {greekFirst ? (
              <>
                <p className="greek-text text-5xl text-brand-800 font-medium text-center leading-snug">{word.word}</p>
                {word.inflection && <p className="greek-text text-base text-brand-500 mt-3">{word.inflection}</p>}
              </>
            ) : (
              <>
                <p className="text-3xl text-brand-800 font-semibold text-center">{word.gloss}</p>
                <p className="text-brand-500 text-sm mt-3">{POS_LABELS[word.pos] ?? word.pos}</p>
              </>
            )}
            <p className="text-brand-400 text-xs mt-8">Tap to reveal</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl min-h-56 border border-gray-200 flex flex-col items-center justify-center p-10 shadow-md gap-1.5">
            {greekFirst ? (
              <>
                <p className="greek-text text-2xl text-brand-800 font-medium text-center">{word.word}</p>
                {word.inflection && <p className="greek-text text-sm text-gray-400">{word.inflection}</p>}
                <div className="my-2 w-8 h-px bg-gray-200" />
                <p className="text-2xl text-gray-900 font-semibold text-center">{word.gloss}</p>
                <p className="text-xs text-gray-400">{POS_LABELS[word.pos] ?? word.pos}</p>
                {word.freq && <p className="text-xs text-gray-300 mt-1">{word.freq.toLocaleString()}× in GNT</p>}
              </>
            ) : (
              <>
                <p className="text-lg text-gray-500 font-medium text-center">{word.gloss}</p>
                <div className="my-2 w-8 h-px bg-gray-200" />
                <p className="greek-text text-4xl text-brand-800 font-medium text-center">{word.word}</p>
                {word.inflection && <p className="greek-text text-sm text-gray-400 mt-1">{word.inflection}</p>}
                {word.freq && <p className="text-xs text-gray-300 mt-2">{word.freq.toLocaleString()}× in GNT</p>}
              </>
            )}
          </div>
        )}
      </div>

      {!flipped ? (
        <p className="text-center text-sm text-gray-400">Tap the card to reveal the answer</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => advance(false)} className="btn btn-secondary border-red-200 text-red-600 hover:bg-red-50">
            <RotateCcw size={14} /> Still learning
          </button>
          <button onClick={() => advance(true)} className="btn btn-primary">Got it!</button>
        </div>
      )}
    </div>
  )
}

// ── Shared checkbox ───────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate = false, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className={clsx(
        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        checked || indeterminate
          ? 'bg-white border-brand-700'
          : 'border-gray-300 hover:border-brand-400'
      )}
      aria-checked={indeterminate ? 'mixed' : checked}
      role="checkbox"
    >
      {checked && !indeterminate && <Check size={11} className="text-brand-700" strokeWidth={3} />}
      {indeterminate && <span className="block w-2 h-0.5 bg-brand-700 rounded-full" />}
    </button>
  )
}

// ── Study Settings ────────────────────────────────────────────────────────────

function StudySettings({
  config, onChange, cardCount, onStart, onShuffle,
}: {
  config: StudyConfig
  onChange: (c: StudyConfig) => void
  cardCount: number
  onStart: () => void
  onShuffle: () => void
}) {
  const [expandedSections, setExpandedSections] = useState<number[]>(ALL_SECTIONS)
  const [listSubKey, setListSubKey] = useState<string | null>(null)

  const subSet = useMemo(() => new Set(config.subsections), [config.subsections])

  // Section-level selection state: 'all' | 'none' | 'partial'
  const sectionState = (s: number): 'all' | 'none' | 'partial' => {
    const keys = SECTION_SUBSECTIONS[s].map(sub => sub.key)
    const selectedCount = keys.filter(k => subSet.has(k)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === keys.length) return 'all'
    return 'partial'
  }

  const toggleSection = (s: number) => {
    const sectionKeys = SECTION_SUBSECTIONS[s].map(sub => sub.key)
    const state = sectionState(s)
    if (state === 'all') {
      onChange({ ...config, subsections: config.subsections.filter(k => !sectionKeys.includes(k)) })
    } else {
      const next = Array.from(new Set([...config.subsections, ...sectionKeys]))
      onChange({ ...config, subsections: next })
    }
  }

  const toggleSubsection = (key: string) => {
    const next = subSet.has(key)
      ? config.subsections.filter(k => k !== key)
      : [...config.subsections, key]
    onChange({ ...config, subsections: next })
  }

  const togglePos = (p: string) => {
    const next = config.pos.includes(p)
      ? config.pos.filter(x => x !== p)
      : [...config.pos, p].sort()
    onChange({ ...config, pos: next })
  }

  const toggleExpand = (s: number) => {
    setExpandedSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const disabled = cardCount === 0 || config.subsections.length === 0 || config.pos.length === 0

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study</h2>
          <p className="text-sm text-gray-500 mt-0.5">{cardCount.toLocaleString()} cards in deck</p>
        </div>
        <button
          onClick={onShuffle}
          disabled={disabled}
          title="Shuffle and start"
          className="p-2 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-40"
        >
          <Shuffle size={18} />
        </button>
      </div>

      {/* Single settings panel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">

        {/* Study Mode */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Study Mode</p>
          <div className="relative">
            <select
              value={config.mode}
              onChange={e => onChange({ ...config, mode: e.target.value as StudyMode })}
              className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-colors cursor-pointer"
            >
              <option value="greek-to-english">Greek → English</option>
              <option value="english-to-greek">English → Greek</option>
              <option value="mixed">Mixed</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Cards filter */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cards</p>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['due', 'all'] as const).map(f => (
              <button
                key={f}
                onClick={() => onChange({ ...config, cardFilter: f })}
                className={clsx(
                  'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  config.cardFilter === f ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {f === 'due' ? 'Due for review' : 'All words'}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Sections */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Frequency Sections</p>
            <div className="flex gap-3">
              <button
                onClick={() => onChange({ ...config, subsections: [...ALL_SUBSECTION_KEYS] })}
                className="text-xs text-brand-700 hover:underline font-medium"
              >
                All
              </button>
              <button
                onClick={() => onChange({ ...config, subsections: [] })}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {ALL_SECTIONS.map(s => {
              const state = sectionState(s)
              const isExpanded = expandedSections.includes(s)
              const subs = SECTION_SUBSECTIONS[s]
              const coverage = SECTION_CUMULATIVE_COVERAGE[s]

              return (
                <div
                  key={s}
                  className={clsx(
                    'rounded-lg border overflow-hidden transition-colors',
                    state !== 'none' ? 'border-brand-600' : 'border-gray-200'
                  )}
                >
                  {/* Section row */}
                  <div className="flex items-center px-3 py-2.5 gap-3 bg-white">
                    <Checkbox
                      checked={state === 'all'}
                      indeterminate={state === 'partial'}
                      onChange={() => toggleSection(s)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">Section §{s}</span>
                      <span className="text-xs text-gray-400 ml-2">{subs.reduce((n, sub) => n + sub.words.length, 0)} words · up to {coverage}% GNT</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(s)}
                      className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </div>

                  {/* Sub-section chips + word list */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-2.5 border-t border-gray-100 bg-white space-y-2">
                      {/* Chip grid — each chip has a selection button + list toggle */}
                      <div className="grid grid-cols-8 gap-1.5">
                        {subs.map(sub => {
                          const isSubSelected = subSet.has(sub.key)
                          const isListed = listSubKey === sub.key
                          return (
                            <div key={sub.key} className="flex flex-col gap-0.5">
                              {/* Selection chip */}
                              <button
                                onClick={() => toggleSubsection(sub.key)}
                                className={clsx(
                                  'flex flex-col items-center justify-center py-2 rounded-lg border text-center transition-colors',
                                  isSubSelected
                                    ? 'bg-white border-brand-700 text-brand-800'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700'
                                )}
                              >
                                <span className="text-sm font-semibold leading-none">{sub.label}</span>
                                <span className={clsx('text-[9px] mt-1 leading-none', isSubSelected ? 'text-brand-500' : 'text-gray-400')}>
                                  {sub.rankRange}
                                </span>
                              </button>
                              {/* Word-list toggle */}
                              <button
                                onClick={() => setListSubKey(isListed ? null : sub.key)}
                                title={`View ${sub.label} word list`}
                                className={clsx(
                                  'flex items-center justify-center py-1 rounded border text-center transition-colors',
                                  isListed
                                    ? 'border-brand-400 bg-brand-50 text-brand-600'
                                    : 'border-gray-100 text-gray-400 hover:border-brand-200 hover:text-brand-500'
                                )}
                              >
                                <List size={9} />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Inline word list for the active subsection in this section */}
                      {listSubKey && subs.some(sub => sub.key === listSubKey) && (() => {
                        const sub = subs.find(sub => sub.key === listSubKey)!
                        return (
                          <div className="rounded-lg border border-gray-200 overflow-hidden">
                            {/* List header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                              <p className="text-xs font-semibold text-gray-700">
                                §{s}{sub.label} · Words {sub.rankRange}
                                <span className="text-gray-400 font-normal ml-1.5">({sub.words.length} words)</span>
                              </p>
                              <button
                                onClick={() => setListSubKey(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            {/* Word rows — 2 columns */}
                            <div className="grid grid-cols-2">
                              {sub.words.map((w, i) => (
                                <div
                                  key={w.word}
                                  className={clsx(
                                    'px-3 py-2 flex items-baseline justify-between gap-2',
                                    i % 2 === 0 ? 'border-r border-gray-100' : '',
                                    i < sub.words.length - 2 ? 'border-b border-gray-100' : ''
                                  )}
                                >
                                  <div className="min-w-0 flex-1 truncate">
                                    <span className="greek-text text-sm font-semibold text-brand-800">{w.word}</span>
                                    {w.inflection && (
                                      <span className="greek-text text-[10px] text-gray-400 ml-1">{w.inflection}</span>
                                    )}
                                    <span className="text-xs text-gray-600 ml-1.5">{w.gloss}</span>
                                  </div>
                                  {w.freq && (
                                    <span className="text-[10px] text-gray-300 shrink-0">×{w.freq.toLocaleString()}</span>
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

        {/* Part of Speech */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Part of Speech</p>
            <div className="flex gap-3">
              <button onClick={() => onChange({ ...config, pos: [...ALL_POS] })} className="text-xs text-brand-700 hover:underline font-medium">All</button>
              <button onClick={() => onChange({ ...config, pos: [] })} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_POS.map(p => {
              const isSelected = config.pos.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePos(p)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm text-left transition-colors',
                    isSelected
                      ? 'border-brand-600 bg-white text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  <div className={clsx(
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-white border-brand-700' : 'border-gray-300'
                  )}>
                    {isSelected && <Check size={9} className="text-brand-700" strokeWidth={3} />}
                  </div>
                  <span className="text-xs font-medium">{POS_LABELS[p] ?? p}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        disabled={disabled}
        className="w-full btn btn-primary py-3 text-base justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'No cards match — adjust filters' : `Start Studying — ${cardCount.toLocaleString()} card${cardCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}

// ── Browse view ──────────────────────────────────────────────────────────────

function BrowseView({ progress }: { progress: ProgressMap }) {
  const [query, setQuery] = useState('')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterPos, setFilterPos] = useState<string>('all')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return WORDS.filter(w => {
      if (filterSection !== 'all' && w.section !== Number(filterSection)) return false
      if (filterPos !== 'all' && w.pos !== filterPos) return false
      if (!q) return true
      return (
        w.word.toLowerCase().includes(q) ||
        w.gloss.toLowerCase().includes(q) ||
        (w.inflection ?? '').toLowerCase().includes(q)
      )
    })
  }, [query, filterSection, filterPos])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Greek or English..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input pl-8 text-sm w-full"
          />
        </div>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="input text-sm w-auto">
          <option value="all">All Sections</option>
          {ALL_SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filterPos} onChange={e => setFilterPos(e.target.value)} className="input text-sm w-auto">
          <option value="all">All Parts</option>
          {ALL_POS.map(p => <option key={p} value={p}>{POS_LABELS[p] ?? p}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} word{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(w => {
          const p = progress[w.word]
          const mastered = p && p.repetitions >= 3 && !isDue(p)
          return (
            <div
              key={w.word}
              className={clsx(
                'border rounded-lg p-3 flex justify-between items-start gap-2',
                mastered ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
              )}
            >
              <div className="min-w-0">
                <p className="greek-text text-base font-medium text-brand-800 leading-tight">{w.word}</p>
                {w.inflection && <p className="greek-text text-xs text-gray-400">{w.inflection}</p>}
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">{w.gloss}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">§{w.section}</span>
                <span className="text-xs text-gray-400">{POS_LABELS[w.pos] ?? w.pos}</span>
                {w.freq && <span className="text-xs text-gray-300">×{w.freq}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
