'use client'
import { useState, useMemo, useEffect } from 'react'
import { Search, GraduationCap, RotateCcw, ChevronRight, ChevronDown, Check, List, X } from 'lucide-react'
import { clsx } from 'clsx'
import { sm2 } from '@/lib/spaced-repetition'
import bgvbData from '@/data/bgvb-vocabulary.json'

// ── Types ────────────────────────────────────────────────────────────────────

interface BgvbWord {
  word: string
  inflection: string | null
  gloss: string
  pos: string
  section: number
  freq: number | null
  order?: number  // PDF frequency rank (1 = most frequent); used for subsection sorting
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
type Tab = 'study' | 'flashcards' | 'browse'
type StudyMode = 'greek-to-english' | 'english-to-greek'

interface Subsection {
  key: string      // e.g. "1-A"
  label: string    // e.g. "A"
  rankRange: string // e.g. "1–20" (position within section)
  words: BgvbWord[]
}

type SectionListMode = 'greek-english' | 'greek' | 'english'

interface StudyConfig {
  mode: StudyMode
  subsections: string[]  // selected subsection keys, e.g. ["1-A", "1-B", "2-A"]
  pos: string[]
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

// Pre-compute subsections: 20-word chunks per section, sorted by PDF frequency rank
// Words with an `order` field (1 = most frequent) are sorted ascending by order.
// Words without order fall after ranked words, sorted by freq desc as fallback.
// WORD_SUBSECTION maps each word → its subsection key (e.g. "1-A")
const SECTION_SUBSECTIONS: Record<number, Subsection[]> = {}
const WORD_SUBSECTION: Record<string, string> = {}

ALL_SECTIONS.forEach(s => {
  const sectionWords = [...WORDS.filter(w => w.section === s)]
    .sort((a, b) => {
      // Primary: order field (ascending: lower order = more frequent = first)
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order
      if (a.order !== undefined) return -1   // a has order, comes first
      if (b.order !== undefined) return 1    // b has order, comes first
      // Fallback: freq descending
      return (b.freq ?? 0) - (a.freq ?? 0)
    })
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
  subsections: [],
  pos: [...ALL_POS],
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

function filterWords(words: BgvbWord[], config: StudyConfig): BgvbWord[] {
  // No sections selected → treat as all sections selected
  const effectiveSubSet = config.subsections.length === 0
    ? new Set(ALL_SUBSECTION_KEYS)
    : new Set(config.subsections)

  return words.filter(w => {
    if (!effectiveSubSet.has(WORD_SUBSECTION[w.word] ?? '')) return false
    if (!config.pos.includes(w.pos)) return false
    return true
  })
}

// ── Main component ───────────────────────────────────────────────────────────

export function VocabBuilder() {
  const [tab, setTab] = useState<Tab>('study')
  const [progress, setProgress] = useState<ProgressMap>({})
  const [config, setConfig] = useState<StudyConfig>(DEFAULT_CONFIG)
  const [sessionWords, setSessionWords] = useState<BgvbWord[] | null>(null)
  const [directions, setDirections] = useState<boolean[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [finished, setFinished] = useState(false)
  const [missedWordKeys, setMissedWordKeys] = useState<Set<string>>(new Set())

  useEffect(() => { setProgress(loadProgress()) }, [])

  const previewWords = useMemo(() => filterWords(WORDS, config), [config])

  const startStudying = (shuffle = false) => {
    let words = filterWords(WORDS, config)
    if (shuffle) words = [...words].sort(() => Math.random() - 0.5)
    const dirs = words.map(() => config.mode !== 'english-to-greek')
    setSessionWords(words)
    setDirections(dirs)
    setIdx(0)
    setFlipped(false)
    setFinished(false)
    setSessionStats({ correct: 0, total: 0 })
    setMissedWordKeys(new Set())
    setTab('flashcards')
  }

  // quality: 1 = Again, 3 = Hard (correct but difficult), 4 = Got it
  const advance = (quality: 1 | 3 | 4) => {
    if (!sessionWords) return
    const word = sessionWords[idx]
    const isAgain = quality === 1

    // Re-queue this card 4 positions ahead when answered "Again"
    if (isAgain) {
      setMissedWordKeys(prev => { const s = new Set(prev); s.add(word.word); return s })
      setSessionWords(prev => {
        if (!prev) return prev
        const next = [...prev]
        next.splice(Math.min(idx + 4, next.length), 0, word)
        return next
      })
    }

    // Update SM-2 progress
    const prev = progress[word.word]
    const result = sm2({
      easeFactor: prev?.easeFactor ?? 2.5,
      interval: prev?.interval ?? 1,
      repetitions: prev?.repetitions ?? 0,
      quality,
    })
    const updated: ProgressMap = {
      ...progress,
      [word.word]: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        dueDate: result.nextReviewDate.toISOString().slice(0, 10),
        correct: (prev?.correct ?? 0) + (quality >= 3 ? 1 : 0),
        total: (prev?.total ?? 0) + 1,
      },
    }
    saveProgress(updated)
    setProgress(updated)
    setSessionStats(s => ({ correct: s.correct + (quality >= 3 ? 1 : 0), total: s.total + 1 }))

    // Only finish when not re-queuing and we've reached the end
    if (!isAgain && idx + 1 >= sessionWords.length) {
      setFinished(true)
    } else {
      setIdx(i => i + 1)
      setFlipped(false)
    }
  }

  // Start a new session using only the words missed this session
  const startMissed = () => {
    if (!sessionWords) return
    const seen = new Set<string>()
    const missed = sessionWords.filter(w => {
      if (!missedWordKeys.has(w.word) || seen.has(w.word)) return false
      seen.add(w.word)
      return true
    })
    if (missed.length === 0) return
    const dirs = missed.map(() => {
      if (config.mode === 'greek-to-english') return true
      if (config.mode === 'english-to-greek') return false
      return Math.random() > 0.5
    })
    setSessionWords(missed)
    setDirections(dirs)
    setIdx(0)
    setFlipped(false)
    setFinished(false)
    setSessionStats({ correct: 0, total: 0 })
    setMissedWordKeys(new Set())
    setTab('flashcards')
  }

  const TABS = [
    { id: 'study'  as Tab, icon: <GraduationCap size={14} />, label: 'Study',  action: () => setTab('study') },
    { id: 'browse' as Tab, icon: <Search size={14} />,        label: 'Browse', action: () => setTab('browse') },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, icon, label, action }) => (
          <button
            key={id}
            onClick={action}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'study' && (
        <StudySettings
          config={config}
          onChange={setConfig}
          cardCount={previewWords.length}
          onStart={() => startStudying(false)}
        />
      )}

      {tab === 'flashcards' && (
        <FlashcardPlayer
          sessionWords={sessionWords ?? []}
          directions={directions}
          idx={idx}
          flipped={flipped}
          finished={finished}
          sessionStats={sessionStats}
          missedWordKeys={missedWordKeys}
          config={config}
          onConfigChange={setConfig}
          onFlip={() => setFlipped(f => !f)}
          onAdvance={advance}
          onGoBack={() => setTab('study')}
          onRestart={() => { setIdx(0); setFlipped(false); setFinished(false); setSessionStats({ correct: 0, total: 0 }); setMissedWordKeys(new Set()) }}
          onStudyMissed={startMissed}
        />
      )}

      {tab === 'browse' && <BrowseView progress={progress} />}
    </div>
  )
}

// ── Flashcard player ──────────────────────────────────────────────────────────

function FlashcardPlayer({
  sessionWords, directions, idx, flipped, finished, sessionStats, missedWordKeys,
  config, onConfigChange, onFlip, onAdvance, onGoBack, onRestart, onStudyMissed,
}: {
  sessionWords: BgvbWord[]
  directions: boolean[]
  idx: number
  flipped: boolean
  finished: boolean
  sessionStats: { correct: number; total: number }
  missedWordKeys: Set<string>
  config: StudyConfig
  onConfigChange: (c: StudyConfig) => void
  onFlip: () => void
  onAdvance: (quality: 1 | 3 | 4) => void
  onGoBack: () => void
  onRestart: () => void
  onStudyMissed: () => void
}) {
  // Two-step "Got it" flow: clicking the button arms it, then Proceed advances.
  // Reset whenever a new card appears.
  const [gotItClicked, setGotItClicked] = useState(false)
  useEffect(() => { setGotItClicked(false) }, [idx])

  // Keyboard shortcuts: Space/Enter to flip; 1/2/3 to rate after flip
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!flipped) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onFlip() }
      } else {
        if (e.key === '1') { e.preventDefault(); onAdvance(1) }
        else if (e.key === '2') { e.preventDefault(); onAdvance(3) }
        else if (e.key === '3') { e.preventDefault(); onAdvance(4) }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [flipped, onFlip, onAdvance])

  if (sessionWords.length === 0) {
    return (
      <div className="text-center py-16 space-y-3 max-w-lg mx-auto">
        <p className="text-xl font-semibold text-gray-700">No cards match</p>
        <p className="text-gray-600 text-sm">Try selecting different sections or parts of speech.</p>
        <button onClick={onGoBack} className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm mt-2">← Back to settings</button>
      </div>
    )
  }

  if (finished) {
    const pct = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0
    // Deduplicate missed words preserving order of first occurrence
    const seen = new Set<string>()
    const missedWords = sessionWords.filter(w => {
      if (!missedWordKeys.has(w.word) || seen.has(w.word)) return false
      seen.add(w.word); return true
    })
    return (
      <div className="max-w-lg mx-auto py-12 space-y-6">
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold text-gray-700">Session Complete</p>
          <p className="text-6xl font-bold text-gray-900 py-2">{pct}%</p>
          <p className="text-gray-500 text-sm">
            {sessionStats.correct} correct · {sessionStats.total - sessionStats.correct} missed · {sessionStats.total} attempts
          </p>
        </div>

        {missedWords.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Words to review ({missedWords.length})</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {missedWords.map(w => (
                <div key={w.word} className="px-4 py-2.5 flex items-baseline justify-between gap-4">
                  <span className="greek-text text-base font-semibold text-gray-900">{w.word}</span>
                  <span className="text-sm text-gray-600">{w.gloss}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={onGoBack}>← Return</button>
          <button className="btn bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 flex-1 justify-center" onClick={onRestart}>Review again</button>
          {missedWords.length > 0 && (
            <button className="btn bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 flex-1 justify-center" onClick={onStudyMissed}>
              Study missed ({missedWords.length})
            </button>
          )}
        </div>
      </div>
    )
  }

  const word = sessionWords[idx]
  if (!word) return null

  const greekFirst = config.mode !== 'english-to-greek'

  return (
    <div className="space-y-6">
      {/* Header: back link + progress bar + counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full">§{word.section}</span>
            <span className="text-sm text-gray-500">{idx + 1} / {sessionWords.length}</span>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['greek-to-english', 'english-to-greek'] as const).map(m => (
              <button
                key={m}
                onClick={() => onConfigChange({ ...config, mode: m })}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  config.mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {m === 'greek-to-english' ? 'Gk → En' : 'En → Gk'}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-400 rounded-full transition-all duration-300"
            style={{ width: `${(idx / sessionWords.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card + Got it column */}
      <div className="flex gap-3 items-stretch">
        {/* Card (clickable to flip) */}
        <div
          className="flex-1 cursor-pointer select-none"
          onClick={onFlip}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onFlip()}
          aria-label="Flip card"
        >
          {!flipped ? (
            <div className="bg-white rounded-2xl min-h-72 flex flex-col items-center justify-center p-12 shadow-md border border-gray-200">
              {greekFirst ? (
                <>
                  <p className="greek-text text-7xl text-gray-900 font-medium text-center leading-snug">{word.word}</p>
                  {word.inflection && <p className="greek-text text-xl text-gray-500 mt-4">{word.inflection}</p>}
                </>
              ) : (
                <>
                  <p className="text-5xl text-gray-900 font-semibold text-center">{word.gloss}</p>
                  <p className="text-gray-600 text-lg mt-4">{POS_LABELS[word.pos] ?? word.pos}</p>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl min-h-72 border border-gray-200 flex flex-col items-center justify-center p-12 shadow-md gap-2">
              {greekFirst ? (
                <>
                  <p className="greek-text text-4xl text-gray-900 font-medium text-center">{word.word}</p>
                  {word.inflection && <p className="greek-text text-base text-gray-500">{word.inflection}</p>}
                  <div className="my-3 w-12 h-px bg-gray-200" />
                  <p className="text-4xl text-gray-900 font-semibold text-center">{word.gloss}</p>
                  <p className="text-sm text-gray-500">{POS_LABELS[word.pos] ?? word.pos}</p>
                  {word.freq && <p className="text-sm text-gray-300 mt-1">{word.freq.toLocaleString()}× in GNT</p>}
                </>
              ) : (
                <>
                  <p className="text-2xl text-gray-500 font-medium text-center">{word.gloss}</p>
                  <div className="my-3 w-12 h-px bg-gray-200" />
                  <p className="greek-text text-6xl text-gray-900 font-medium text-center">{word.word}</p>
                  {word.inflection && <p className="greek-text text-base text-gray-500 mt-1">{word.inflection}</p>}
                  {word.freq && <p className="text-sm text-gray-300 mt-2">{word.freq.toLocaleString()}× in GNT</p>}
                </>
              )}
            </div>
          )}
        </div>

        {/* Got it → Proceed column: zero gap so Proceed appears directly under
            Got it — cursor doesn't need to move between the two clicks */}
        {flipped && (
          <div className="flex flex-col justify-center">
            <button
              onClick={() => setGotItClicked(true)}
              disabled={gotItClicked}
              className={`flex flex-col items-center gap-0.5 py-3 px-4 w-24 border font-medium transition-colors ${
                gotItClicked
                  ? 'bg-green-50 border-green-300 text-green-600 cursor-default rounded-t-lg rounded-b-none'
                  : 'bg-white border-green-200 text-green-700 hover:bg-green-50 rounded-lg'
              }`}
            >
              <span className="text-base">{gotItClicked ? '✓ Got it' : 'Got it'}</span>
              <span className="text-xs text-gray-300 font-normal">[3]</span>
            </button>
            {gotItClicked && (
              <button
                onClick={() => onAdvance(4)}
                className="flex flex-col items-center gap-0.5 bg-green-600 hover:bg-green-700 text-white py-3 px-4 w-24 border border-green-600 rounded-t-none rounded-b-lg transition-colors"
              >
                <span className="text-base font-medium">Proceed</span>
                <span className="text-xs text-green-200 font-normal">→</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Again / Hard buttons */}
      {!flipped ? (
        <p className="text-center text-base text-gray-500">Tap the card or press Space to reveal</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAdvance(1)}
            className="btn flex-col gap-0.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 py-3"
          >
            <span className="text-base font-medium">Again</span>
            <span className="text-xs text-gray-300 font-normal">[1]</span>
          </button>
          <button
            onClick={() => onAdvance(3)}
            className="btn flex-col gap-0.5 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 py-3"
          >
            <span className="text-base font-medium">Hard</span>
            <span className="text-xs text-gray-300 font-normal">[2]</span>
          </button>
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
          ? 'bg-white border-gray-300'
          : 'border-gray-300 hover:border-gray-400'
      )}
      aria-checked={indeterminate ? 'mixed' : checked}
      role="checkbox"
    >
      {checked && !indeterminate && <Check size={11} className="text-gray-700" strokeWidth={3} />}
      {indeterminate && <span className="block w-2 h-0.5 bg-gray-600 rounded-full" />}
    </button>
  )
}

// ── Study Settings ────────────────────────────────────────────────────────────

function StudySettings({
  config, onChange, cardCount, onStart,
}: {
  config: StudyConfig
  onChange: (c: StudyConfig) => void
  cardCount: number
  onStart: () => void
}) {
  const [expandedSections, setExpandedSections] = useState<number[]>(ALL_SECTIONS)
  const [listSubKey, setListSubKey] = useState<string | null>(null)
  const [subListMode, setSubListMode] = useState<Record<string, SectionListMode>>({})

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

  const disabled = cardCount === 0 || config.pos.length === 0

  return (
    <div className="space-y-5">
      {/* Flashcards button */}
      <button
        onClick={onStart}
        disabled={disabled}
        className="w-full btn bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 active:bg-gray-100 py-4 text-lg justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'No cards match — adjust filters' : 'Flashcards'}
      </button>

      {/* Single settings panel */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">

        {/* Frequency Sections */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Frequency Sections</p>
            <div className="flex gap-3">
              <button
                onClick={() => onChange({ ...config, subsections: [...ALL_SUBSECTION_KEYS] })}
                className="text-sm text-gray-700 hover:underline font-medium"
              >
                All
              </button>
              <button
                onClick={() => onChange({ ...config, subsections: [] })}
                className="text-sm text-gray-500 hover:text-gray-700"
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
                    'border-gray-200'
                  )}
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
                      <span className="text-sm text-gray-500 ml-2">{subs.reduce((n, sub) => n + sub.words.length, 0)} words · up to {coverage}% GNT</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(s)}
                      className="p-0.5 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white space-y-3">
                      {/* Chip grid — each chip has a selection button + list toggle */}
                      <div className="grid grid-cols-8 gap-2">
                        {subs.map(sub => {
                          const isSubSelected = subSet.has(sub.key)
                          const isListed = listSubKey === sub.key
                          return (
                            <div key={sub.key} className="flex flex-col gap-1">
                              {/* Selection chip */}
                              <button
                                onClick={() => toggleSubsection(sub.key)}
                                className={clsx(
                                  'flex flex-col items-center justify-center py-2.5 rounded-lg border text-center transition-colors',
                                  isSubSelected
                                    ? 'bg-gray-100 border-gray-300 text-gray-900'
                                    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900'
                                )}
                              >
                                <span className="text-base font-semibold leading-none">{sub.label}</span>
                                <span className={clsx('text-xs mt-1 leading-none', isSubSelected ? 'text-gray-600' : 'text-gray-500')}>
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
                                    ? 'border-gray-200 bg-gray-50 text-gray-700'
                                    : 'border-gray-200 text-gray-500 hover:text-gray-700'
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
                                <span className="text-gray-400 font-normal ml-1.5">({sub.words.length} words)</span>
                              </p>
                              <div className="flex items-center gap-2">
                                {/* Mode toggle */}
                                <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5">
                                  {(['greek-english', 'greek', 'english'] as const).map(m => (
                                    <button
                                      key={m}
                                      onClick={() => setMode(m)}
                                      className={clsx(
                                        'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                                        mode === m
                                          ? 'bg-white text-gray-900 shadow-sm'
                                          : 'text-gray-400 hover:text-gray-600'
                                      )}
                                    >
                                      {m === 'greek-english' ? 'Greek-English' : m === 'greek' ? 'Greek' : 'English'}
                                    </button>
                                  ))}
                                </div>
                                <button
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
                                    i < sub.words.length - cols ? 'border-b border-gray-100' : ''
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
                                      {w.freq && (
                                        <span className="text-xs text-gray-300 shrink-0">×{w.freq.toLocaleString()}</span>
                                      )}
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

        {/* Part of Speech */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Part of Speech</p>
            <div className="flex gap-3">
              <button onClick={() => onChange({ ...config, pos: [...ALL_POS] })} className="text-sm text-gray-700 hover:underline font-medium">All</button>
              <button onClick={() => onChange({ ...config, pos: [] })} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_POS.map(p => {
              const isSelected = config.pos.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePos(p)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition-colors',
                    isSelected
                      ? 'border-gray-300 bg-gray-100 text-gray-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className={clsx(
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isSelected ? 'bg-white border-gray-300' : 'border-gray-300'
                  )}>
                    {isSelected && <Check size={11} className="text-gray-700" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-medium">{POS_LABELS[p] ?? p}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

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
                <p className="greek-text text-base font-medium text-gray-900 leading-tight">{w.word}</p>
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
