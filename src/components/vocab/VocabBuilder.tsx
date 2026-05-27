'use client'
import { useState, useMemo, useEffect } from 'react'
import { BookOpen, Search, LayoutDashboard, GraduationCap, RotateCcw, ChevronRight } from 'lucide-react'
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
  const [directions, setDirections] = useState<boolean[]>([]) // true = greek-to-english
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  const today = todayStr()

  const previewWords = useMemo(
    () => filterWords(allWords, config, progress, today),
    [allWords, config, progress, today]
  )

  const startStudying = () => {
    const words = filterWords(allWords, config, progress, today)
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

  // ── Settings screen ──
  if (sessionWords === null) {
    return (
      <StudySettings
        config={config}
        onChange={setConfig}
        cardCount={previewWords.length}
        onStart={startStudying}
      />
    )
  }

  // ── Empty deck ──
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

  // ── Session complete ──
  if (finished) {
    return (
      <div className="text-center py-16 space-y-4 max-w-lg mx-auto">
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

  // ── Flashcard ──
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <button onClick={goBack} className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
          ← Settings
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Card {idx + 1} of {sessionWords.length}</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">§{word.section}</span>
        </div>
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
          <div className="bg-brand-800 rounded-2xl h-56 flex flex-col items-center justify-center p-8 shadow-lg">
            {greekFirst ? (
              <>
                <p className="greek-text text-4xl text-parchment-100 font-medium text-center leading-snug">{word.word}</p>
                {word.inflection && <p className="greek-text text-sm text-brand-300 mt-2">{word.inflection}</p>}
              </>
            ) : (
              <>
                <p className="text-2xl text-parchment-100 font-semibold text-center">{word.gloss}</p>
                <p className="text-brand-300 text-sm mt-2">{POS_LABELS[word.pos] ?? word.pos}</p>
              </>
            )}
            <p className="text-brand-400 text-xs mt-5">Tap to reveal</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl h-56 border-2 border-brand-100 flex flex-col items-center justify-center p-8 shadow-lg gap-2">
            {greekFirst ? (
              <>
                <p className="greek-text text-2xl text-brand-800 font-medium text-center">{word.word}</p>
                {word.inflection && <p className="greek-text text-sm text-gray-400">{word.inflection}</p>}
                <p className="text-lg text-gray-900 font-semibold text-center mt-1">{word.gloss}</p>
                <p className="text-xs text-gray-400">{POS_LABELS[word.pos] ?? word.pos}</p>
              </>
            ) : (
              <>
                <p className="text-base text-gray-500 text-center">{word.gloss}</p>
                <p className="greek-text text-3xl text-brand-800 font-medium text-center mt-2">{word.word}</p>
                {word.inflection && <p className="greek-text text-sm text-gray-400">{word.inflection}</p>}
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

// ── Study Settings panel ──────────────────────────────────────────────────────

function StudySettings({
  config, onChange, cardCount, onStart,
}: {
  config: StudyConfig
  onChange: (c: StudyConfig) => void
  cardCount: number
  onStart: () => void
}) {
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

  const disabled = cardCount === 0 || config.sections.length === 0 || config.pos.length === 0

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Study Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your flashcard session</p>
      </div>

      {/* Study Mode */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Study Mode</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['greek-to-english', 'english-to-greek', 'mixed'] as StudyMode[]).map(m => (
            <button
              key={m}
              onClick={() => onChange({ ...config, mode: m })}
              className={clsx(
                'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                config.mode === m ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {m === 'greek-to-english' ? 'Greek → English' : m === 'english-to-greek' ? 'English → Greek' : 'Mixed'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Cards</h3>
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
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Frequency Sections</h3>
          <div className="flex gap-3">
            <button onClick={() => onChange({ ...config, sections: [...ALL_SECTIONS] })} className="text-xs text-brand-600 hover:underline">All</button>
            <button onClick={() => onChange({ ...config, sections: [] })} className="text-xs text-gray-400 hover:underline">Clear</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {ALL_SECTIONS.map(s => (
            <button
              key={s}
              onClick={() => toggleSection(s)}
              className={clsx(
                'py-2 rounded-lg text-sm font-medium border transition-colors',
                config.sections.includes(s)
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
              )}
            >
              §{s}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          {config.sections.length === 0
            ? 'No sections selected'
            : config.sections.length === 7
            ? `All sections — up to ${SECTION_CUMULATIVE_COVERAGE[7]}% GNT`
            : `§${Math.min(...config.sections)}–§${Math.max(...config.sections)} — up to ${SECTION_CUMULATIVE_COVERAGE[Math.max(...config.sections)]}% GNT`}
        </p>
      </div>

      {/* Part of Speech */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Part of Speech</h3>
          <div className="flex gap-3">
            <button onClick={() => onChange({ ...config, pos: [...ALL_POS] })} className="text-xs text-brand-600 hover:underline">All</button>
            <button onClick={() => onChange({ ...config, pos: [] })} className="text-xs text-gray-400 hover:underline">Clear</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_POS.map(p => (
            <button
              key={p}
              onClick={() => togglePos(p)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                config.pos.includes(p)
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
              )}
            >
              {POS_LABELS[p] ?? p}
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        disabled={disabled}
        className="w-full btn btn-primary py-3 text-base justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'No cards match — adjust filters' : `Start Studying — ${cardCount} card${cardCount !== 1 ? 's' : ''}`}
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
