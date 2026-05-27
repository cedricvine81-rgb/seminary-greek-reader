'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
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
  dueDate: string   // ISO date string
  correct: number
  total: number
}

type ProgressMap = Record<string, WordProgress>

type Tab = 'dashboard' | 'study' | 'browse'

// ── Constants ────────────────────────────────────────────────────────────────

const WORDS = bgvbData as BgvbWord[]
const STORAGE_KEY = 'bgvb-progress-v1'

const SECTION_SIZES: Record<number, number> = { 1: 179, 2: 202, 3: 159, 4: 160, 5: 160, 6: 160, 7: 170 }
const SECTION_CUMULATIVE_COVERAGE: Record<number, number> = {
  1: 69.5, 2: 77.2, 3: 81.6, 4: 84.4, 5: 86.4, 6: 87.8, 7: 89.2,
}

const POS_LABELS: Record<string, string> = {
  Verb: 'Verb', Noun: 'Noun', Adj: 'Adjective', Adv: 'Adverb',
  Prep: 'Preposition', Conj: 'Conjunction', Pron: 'Pronoun',
  Art: 'Article', Interj: 'Interjection', Particle: 'Particle',
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

// ── Main component ───────────────────────────────────────────────────────────

export function VocabBuilder() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [progress, setProgress] = useState<ProgressMap>({})

  useEffect(() => { setProgress(loadProgress()) }, [])

  const studyWords = useMemo(() => {
    const today = todayStr()
    return WORDS.filter(w => {
      const p = progress[w.word]
      return !p || p.dueDate <= today
    })
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
    return [1, 2, 3, 4, 5, 6, 7].map(s => {
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
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['dashboard', 'study', 'browse'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              tab === t
                ? 'bg-white text-brand-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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
          dueCount={studyWords.length}
          accuracy={accuracyTotal}
          sectionProgress={sectionProgress}
          onStudy={() => setTab('study')}
          onBrowse={() => setTab('browse')}
          onReset={() => { saveProgress({}); setProgress({}) }}
        />
      )}
      {tab === 'study' && (
        <StudyView
          words={studyWords}
          progress={progress}
          onProgress={setProgress}
        />
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
  const maxMastered = Math.max(...sectionProgress.map(s => s.total))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biblical Greek Vocabulary</h1>
        <p className="text-sm text-gray-500 mt-1">
          Master the 1,100+ most frequent words in the Greek New Testament
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Words" value={WORDS.length.toString()} />
        <StatCard label="Mastered" value={masteredCount.toString()} sub={`${Math.round((masteredCount / WORDS.length) * 100)}% of total`} />
        <StatCard label="Due Today" value={dueCount.toString()} sub={accuracy !== null ? `${accuracy}% accuracy` : 'No reviews yet'} />
      </div>

      {/* NT Coverage */}
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
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <ActionCard
          title="Start Studying"
          sub={`${dueCount} cards due for review`}
          icon={<GraduationCap size={20} />}
          onClick={onStudy}
        />
        <ActionCard
          title="Browse Words"
          sub="Search & filter vocabulary"
          icon={<BookOpen size={20} />}
          onClick={onBrowse}
        />
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
  words, progress, onProgress,
}: {
  words: BgvbWord[]
  progress: ProgressMap
  onProgress: (p: ProgressMap) => void
}) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  const word = words[idx]

  const advance = useCallback((knew: boolean) => {
    if (!word) return
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
    if (idx + 1 >= words.length) {
      setFinished(true)
    } else {
      setIdx(i => i + 1)
      setFlipped(false)
    }
  }, [word, idx, words.length, progress, onProgress])

  if (words.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-xl font-semibold text-brand-700">All caught up!</p>
        <p className="text-gray-500 text-sm">No words due for review. Check back tomorrow.</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-2xl font-bold text-brand-700">Session Complete!</p>
        <p className="text-gray-600">
          {sessionStats.correct} correct · {sessionStats.total - sessionStats.correct} incorrect
          {' '}out of {sessionStats.total}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => { setIdx(0); setFlipped(false); setFinished(false); setSessionStats({ correct: 0, total: 0 }) }}
        >
          Review Again
        </button>
      </div>
    )
  }

  if (!word) return null

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Card {idx + 1} of {words.length}</span>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">§{word.section}</span>
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
          <div className="bg-brand-800 rounded-2xl h-56 flex flex-col items-center justify-center p-8 shadow-lg">
            <p className="greek-text text-4xl text-parchment-100 font-medium text-center leading-snug">
              {word.word}
            </p>
            {word.inflection && (
              <p className="greek-text text-sm text-brand-300 mt-2">{word.inflection}</p>
            )}
            <p className="text-brand-400 text-xs mt-5">Tap to reveal</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl h-56 border-2 border-brand-100 flex flex-col items-center justify-center p-8 shadow-lg gap-2">
            <p className="greek-text text-2xl text-brand-800 font-medium text-center">
              {word.word}
            </p>
            {word.inflection && (
              <p className="greek-text text-sm text-gray-400">{word.inflection}</p>
            )}
            <p className="text-lg text-gray-900 font-semibold text-center mt-1">{word.gloss}</p>
            <p className="text-xs text-gray-400">{POS_LABELS[word.pos] ?? word.pos}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {!flipped ? (
        <p className="text-center text-sm text-gray-400">Tap the card to reveal the definition</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => advance(false)}
            className="btn btn-secondary border-red-200 text-red-600 hover:bg-red-50"
          >
            <RotateCcw size={14} /> Still learning
          </button>
          <button
            onClick={() => advance(true)}
            className="btn btn-primary"
          >
            Got it!
          </button>
        </div>
      )}
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
      const posKey = filterPos !== 'all' ? filterPos : null
      if (posKey && w.pos !== posKey) return false
      if (!q) return true
      return (
        w.word.toLowerCase().includes(q) ||
        w.gloss.toLowerCase().includes(q) ||
        (w.inflection ?? '').toLowerCase().includes(q)
      )
    })
  }, [query, filterSection, filterPos])

  const posList = useMemo(() => {
    const set = new Set(WORDS.map(w => w.pos))
    return Array.from(set).sort()
  }, [])

  return (
    <div className="space-y-4">
      {/* Filters */}
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
        <select
          value={filterSection}
          onChange={e => setFilterSection(e.target.value)}
          className="input text-sm w-auto"
        >
          <option value="all">All Sections</option>
          {[1,2,3,4,5,6,7].map(s => (
            <option key={s} value={s}>Section {s}</option>
          ))}
        </select>
        <select
          value={filterPos}
          onChange={e => setFilterPos(e.target.value)}
          className="input text-sm w-auto"
        >
          <option value="all">All Parts</option>
          {posList.map(p => (
            <option key={p} value={p}>{POS_LABELS[p] ?? p}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400">{filtered.length} word{filtered.length !== 1 ? 's' : ''}</p>

      {/* Word grid */}
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
                <p className="greek-text text-base font-medium text-brand-800 leading-tight">
                  {w.word}
                </p>
                {w.inflection && (
                  <p className="greek-text text-xs text-gray-400">{w.inflection}</p>
                )}
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
