'use client'
import { useState, useMemo, useEffect } from 'react'
import { BookOpen, Search, LayoutDashboard, GraduationCap, RotateCcw, ChevronRight, ChevronDown, Check, Shuffle } from 'lucide-react'
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
type Tab = 'dashboard' | 'study' | 'browse'
type StudyMode = 'greek-to-english' | 'english-to-greek' | 'mixed'

interface StudyConfig {
  mode: StudyMode
  sections: number[]
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

const DEFAULT_CONFIG: StudyConfig = {
  mode: 'greek-to-english',
  sections: [...ALL_SECTIONS],
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
  return words.filter(w => {
    if (!config.sections.includes(w.section)) return false
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

  const dueCount = useMemo(() => {
    const today = todayStr()
    return WORDS.filter(w => { const p = progress[w.word]; return !p || p.dueDate <= today }).length
  }, [progress])

  const masteredCount = useMemo(
    () => Object.values(progress).filter(p => p.repetitions >= 3 && !isDue(p)).length,
    [progress]
  )

  const accuracyTotal = useMemo(() => {
    const vals = Object.values(progress)
    const total = vals.reduce((s, p) => s + p.total, 0)
    const correct = vals.reduce((s, p) => s + p.correct, 0)
    return total > 0 ? Math.round((correct / total) * 100) : null
  }, [progress])

  const sectionProgress = useMemo(() => {
    return ALL_SECTIONS.map(s => {
      const sectionWords = WORDS.filter(w => w.section === s)
      const mastered = sectionWords.filter(w => {
        const p = progress[w.word]
        return p && p.repetitions >= 3 && !isDue(p)
      }).length
      return { section: s, total: sectionWords.length, mastered }
    })
  }, [progress])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['dashboard', 'study', 'browse'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              tab === t ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t === 'dashboard' && <LayoutDashboard size={14} />}
            {t === 'study' && <GraduationCap size={14} />}
            {t === 'browse' && <Search size={14} />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <Dashboard
          masteredCount={masteredCount}
          dueCount={dueCount}
          accuracy={accuracyTotal}
          sectionProgress={sectionProgress}
          onStudy={() => setTab('study')}
          onBrowse={() => setTab('browse')}
          onReset={() => { saveProgress({}); setProgress({}) }}
        />
      )}
      {tab === 'study' && (
        <StudyView allWords={WORDS} progress={progress} onProgress={setProgress} />
      )}
      {tab === 'browse' && <BrowseView progress={progress} />}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({
  masteredCount, dueCount, accuracy, sectionProgress, onStudy, onBrowse, onReset,
}: {
  masteredCount: number
  dueCount: number
  accuracy: number | null
  sectionProgress: { section: number; total: number; mastered: number }[]
  onStudy: () => void
  onBrowse: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biblical Greek Vocabulary</h1>
        <p className="text-sm text-gray-500 mt-1">
          Master the 1,100+ most frequent words in the Greek New Testament
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Words" value={WORDS.length.toString()} />
        <StatCard label="Mastered" value={masteredCount.toString()} sub={`${Math.round((masteredCount / WORDS.length) * 100)}% of total`} />
        <StatCard label="Due Today" value={dueCount.toString()} sub={accuracy !== null ? `${accuracy}% accuracy` : 'No reviews yet'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">NT Coverage by Section</h2>
        <div className="space-y-2">
          {sectionProgress.map(({ section, total, mastered }) => {
            const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
            const coverage = SECTION_CUMULATIVE_COVERAGE[section]
            return (
              <div key={section} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>§{section} — up to {coverage}% GNT</span>
                  <span>{mastered}/{total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ActionCard title="Start Studying" sub={`${dueCount} cards due for review`} icon={<GraduationCap size={20} />} onClick={onStudy} />
        <ActionCard title="Browse Words" sub="Search & filter vocabulary" icon={<BookOpen size={20} />} onClick={onBrowse} />
      </div>

      {masteredCount > 0 && (
        <div className="text-right">
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Reset all progress
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-3xl font-bold text-brand-800">{value}</p>
      <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function ActionCard({ title, sub, icon, onClick }: { title: string; sub: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-brand-300 hover:bg-brand-50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="text-brand-700">{icon}</div>
        <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-600 transition-colors" />
      </div>
      <p className="font-semibold text-gray-900 mt-3">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </button>
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
        <p className="text-gray-500 text-sm">Try switching to "All words" or adjust your section/POS filters.</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={goBack} className="text-xs text-gray-400 hover:text-brand-600 transition-colors mb-1 block">
            ← Settings
          </button>
          <p className="text-sm text-gray-500">Card {idx + 1} of {sessionWords.length}</p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">§{word.section}</span>
      </div>

      {/* Card */}
      <div
        className="cursor-pointer select-none"
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(f => !f)}
        aria-label="Flip card"
      >
        {!flipped ? (
          <div className="bg-brand-800 rounded-2xl min-h-56 flex flex-col items-center justify-center p-10 shadow-md">
            <p className="text-xs font-semibold tracking-widest text-brand-400 mb-4 uppercase">
              {greekFirst ? 'Greek' : 'English'}
            </p>
            {greekFirst ? (
              <>
                <p className="greek-text text-5xl text-parchment-100 font-medium text-center leading-snug">{word.word}</p>
                {word.inflection && <p className="greek-text text-base text-brand-300 mt-3">{word.inflection}</p>}
              </>
            ) : (
              <>
                <p className="text-3xl text-parchment-100 font-semibold text-center">{word.gloss}</p>
                <p className="text-brand-300 text-sm mt-3">{POS_LABELS[word.pos] ?? word.pos}</p>
              </>
            )}
            <p className="text-brand-500 text-xs mt-8">Tap to reveal</p>
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

      {/* Controls */}
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

// ── Study Settings ────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className={clsx(
        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        checked ? 'bg-brand-800 border-brand-800' : 'border-gray-300 hover:border-brand-400'
      )}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && <Check size={11} className="text-white" strokeWidth={3} />}
    </button>
  )
}

function StudySettings({
  config, onChange, cardCount, onStart, onShuffle,
}: {
  config: StudyConfig
  onChange: (c: StudyConfig) => void
  cardCount: number
  onStart: () => void
  onShuffle: () => void
}) {
  const [expandedSections, setExpandedSections] = useState<number[]>([])

  const toggleSection = (s: number) => {
    const next = config.sections.includes(s)
      ? config.sections.filter(x => x !== s)
      : [...config.sections, s].sort((a, b) => a - b)
    onChange({ ...config, sections: next })
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

  const sectionWordCounts = useMemo(
    () => Object.fromEntries(ALL_SECTIONS.map(s => [s, WORDS.filter(w => w.section === s).length])),
    []
  )

  const disabled = cardCount === 0 || config.sections.length === 0 || config.pos.length === 0

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
              <button onClick={() => onChange({ ...config, sections: [...ALL_SECTIONS] })} className="text-xs text-brand-700 hover:underline font-medium">All</button>
              <button onClick={() => onChange({ ...config, sections: [] })} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
          </div>
          <div className="space-y-1.5">
            {ALL_SECTIONS.map(s => {
              const isSelected = config.sections.includes(s)
              const isExpanded = expandedSections.includes(s)
              const coverage = SECTION_CUMULATIVE_COVERAGE[s]
              const wordCount = sectionWordCounts[s]
              return (
                <div
                  key={s}
                  className={clsx(
                    'rounded-lg border transition-colors overflow-hidden',
                    isSelected ? 'border-brand-200 bg-brand-50' : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-center px-3 py-2.5 gap-3">
                    <Checkbox checked={isSelected} onChange={() => toggleSection(s)} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">Section §{s}</span>
                      <span className="text-xs text-gray-400 ml-2">{wordCount} words · up to {coverage}% GNT</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(s)}
                      className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded
                        ? <ChevronDown size={15} />
                        : <ChevronRight size={15} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-100 bg-white">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Covers <strong>{coverage}%</strong> of New Testament text cumulatively.
                        This section contains <strong>{wordCount}</strong> vocabulary words.
                      </p>
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
                      ? 'border-brand-200 bg-brand-50 text-brand-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  <div className={clsx(
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-brand-800 border-brand-800' : 'border-gray-300'
                  )}>
                    {isSelected && <Check size={9} className="text-white" strokeWidth={3} />}
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
